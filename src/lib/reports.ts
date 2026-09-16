export type CostMap = Map<string, number | null | undefined>;

export function buildCostMap(products: { id: string; costPrice: number | null }[]): CostMap {
  return new Map(products.map((p) => [p.id, p.costPrice]));
}

export function orderCost(
  items: { productId: string; quantity: number }[],
  costByProductId: CostMap
): number {
  return items.reduce(
    (sum, item) => sum + (costByProductId.get(item.productId) ?? 0) * item.quantity,
    0
  );
}

/**
 * Ganancia neta de un pedido: total cobrado (ya con el descuento de la
 * revendedora aplicado) menos el costo de los productos vendidos (0 para los
 * que no tienen costo cargado).
 */
export function orderNetProfit(
  order: {
    total: number;
    items: { productId: string; quantity: number }[];
  },
  costByProductId: CostMap
): number {
  return order.total - orderCost(order.items, costByProductId);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

export function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function monthKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Fecha (lunes) de inicio de la semana que contiene `date`, como clave YYYY-MM-DD. */
export function weekKey(date: Date): string {
  const d = startOfDay(date);
  const diffToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return dayKey(d);
}

// Argentina no tiene horario de verano: siempre UTC-3. Estas funciones calculan
// el lunes (hora Argentina) de la semana de un instante sin depender de la
// zona horaria del proceso (en producción corre en UTC), para el sistema de
// premios semanales.
const ARGENTINA_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Lunes 00:00 (hora Argentina) de la semana que contiene `date`, como instante real. */
export function argentinaWeekStart(date: Date): Date {
  const wall = new Date(date.getTime() - ARGENTINA_OFFSET_MS);
  const diffToMonday = (wall.getUTCDay() + 6) % 7;
  const mondayWallMidnight = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate() - diffToMonday
  );
  return new Date(mondayWallMidnight + ARGENTINA_OFFSET_MS);
}

/** Clave (YYYY-MM-DD, fecha de Argentina) del lunes de la semana que contiene `date`. */
export function argentinaWeekKey(date: Date): string {
  const start = argentinaWeekStart(date);
  return new Date(start.getTime() - ARGENTINA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Rango [inicio, fin) en instantes reales de la semana (lunes a domingo, hora Argentina) identificada por su clave. */
export function argentinaWeekRangeFromKey(key: string): { start: Date; end: Date } {
  const [y, m, d] = key.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) + ARGENTINA_OFFSET_MS);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Clave de la semana anterior o siguiente a la dada. */
export function shiftWeekKey(key: string, weeks: number): string {
  const { start } = argentinaWeekRangeFromKey(key);
  return argentinaWeekKey(new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000));
}

/**
 * Margen de ganancia promedio (ponderado por monto vendido) de un conjunto de
 * items vendidos: suma de (precio - costo) sobre suma de precio, solo entre
 * los productos que tienen precio de costo cargado. Si ninguno lo tiene,
 * devuelve null.
 */
export function revenueWeightedMarginPercent(
  items: { productId: string; price: number; quantity: number }[],
  costByProductId: CostMap
): number | null {
  let revenue = 0;
  let profit = 0;
  for (const item of items) {
    const cost = costByProductId.get(item.productId);
    if (cost == null || cost <= 0 || item.price <= 0) continue;
    revenue += item.price * item.quantity;
    profit += (item.price - cost) * item.quantity;
  }
  if (revenue <= 0) return null;
  return (profit / revenue) * 100;
}

type OrderForStats = {
  status: string;
  total: number;
  createdAt: Date;
  resellerId: string | null;
  items: { productId: string; productName: string; price: number; quantity: number }[];
};

export function buildResellerStats(
  reseller: { id: string },
  orders: OrderForStats[],
  costMap: CostMap
) {
  const active = orders.filter((o) => o.resellerId === reseller.id && o.status !== "CANCELADO");
  const salesCount = active.length;
  const totalSales = active.reduce((sum, o) => sum + o.total, 0);
  const netProfitGenerated = active.reduce((sum, o) => sum + orderNetProfit(o, costMap), 0);

  const productAgg = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of active) {
    for (const item of o.items) {
      const entry = productAgg.get(item.productId) ?? {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue += item.price * item.quantity;
      productAgg.set(item.productId, entry);
    }
  }
  const products = Array.from(productAgg.values()).sort((a, b) => b.quantity - a.quantity);

  return { salesCount, totalSales, netProfitGenerated, products };
}

/**
 * Progreso de una revendedora sobre cada premio, según el total comprado
 * (`totalSales`) contra el monto objetivo de cada uno. Ordenado por monto
 * objetivo ascendente.
 */
export function buildRewardProgress(
  totalSales: number,
  tiers: { id: string; title: string; description: string | null; targetAmount: number }[]
) {
  return tiers
    .slice()
    .sort((a, b) => a.targetAmount - b.targetAmount)
    .map((tier) => ({
      ...tier,
      achieved: totalSales >= tier.targetAmount,
      remaining: Math.max(0, tier.targetAmount - totalSales),
      progressPercent: Math.min(100, (totalSales / tier.targetAmount) * 100),
    }));
}
