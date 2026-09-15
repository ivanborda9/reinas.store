import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { computeProfit } from "@/lib/margin";
import { getSiteSettings } from "@/lib/settings";
import {
  buildCostMap,
  orderNetProfit,
  revenueWeightedMarginPercent,
  startOfDay,
  daysAgo,
  dayKey,
  weekKey,
  monthKey,
} from "@/lib/reports";

export const dynamic = "force-dynamic";

type MarginPeriod = "dia" | "semana" | "mes";

function formatMargin(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { margenPeriodo?: string };
}) {
  const [orders, products, settings] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: "CANCELADO" }, paymentMethod: { not: "MOSTRADOR" } },
      include: { items: true, reseller: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ select: { id: true, category: true, costPrice: true, price: true, active: true } }),
    getSiteSettings(),
  ]);
  const targetMargin = settings.targetMarginPercent;

  const costMap = buildCostMap(products);
  const productCategory = new Map(products.map((p) => [p.id, p.category]));

  // Margen de ganancia promedio de los productos activos (precio vs. costo cargado)
  const activeProducts = products.filter((p) => p.active);
  const productMargins = activeProducts
    .map((p) => computeProfit(p.price, p.costPrice)?.marginPercent)
    .filter((m): m is number => m != null);
  const avgProductMargin =
    productMargins.length > 0
      ? productMargins.reduce((a, b) => a + b, 0) / productMargins.length
      : null;
  const productsWithoutCost = activeProducts.length - productMargins.length;

  // Margen de ganancia promedio de las ventas (precio vs. costo, ponderado por monto vendido)
  const allSoldItems = orders.flatMap((o) =>
    o.items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity }))
  );
  const avgSalesMargin = revenueWeightedMarginPercent(allSoldItems, costMap);

  const margenPeriodo: MarginPeriod =
    searchParams.margenPeriodo === "semana" || searchParams.margenPeriodo === "mes"
      ? searchParams.margenPeriodo
      : "dia";

  const marginKeyFn = margenPeriodo === "semana" ? weekKey : margenPeriodo === "mes" ? monthKey : dayKey;
  const marginCutoff =
    margenPeriodo === "dia" ? daysAgo(13) : margenPeriodo === "semana" ? daysAgo(7 * 11) : null;

  const marginBuckets = new Map<string, { productId: string; price: number; quantity: number }[]>();
  for (const o of orders) {
    if (marginCutoff && o.createdAt < marginCutoff) continue;
    const key = marginKeyFn(o.createdAt);
    const bucket = marginBuckets.get(key) ?? [];
    for (const item of o.items) {
      bucket.push({ productId: item.productId, price: item.price, quantity: item.quantity });
    }
    marginBuckets.set(key, bucket);
  }
  const marginRows = Array.from(marginBuckets.entries())
    .map(([key, items]) => ({
      key,
      margin: revenueWeightedMarginPercent(items, costMap),
      ventas: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));

  function statsForRange(from: Date) {
    const filtered = orders.filter((o) => o.createdAt >= from);
    return {
      pedidos: filtered.length,
      ventas: filtered.reduce((sum, o) => sum + o.total, 0),
      ganancia: filtered.reduce((sum, o) => sum + orderNetProfit(o, costMap), 0),
    };
  }

  const hoy = statsForRange(startOfDay(new Date()));
  const ultimos7 = statsForRange(daysAgo(6));
  const ultimos30 = statsForRange(daysAgo(29));

  // Ventas por día (últimos 14 días)
  const dailyMap = new Map<string, { pedidos: number; ventas: number; ganancia: number }>();
  const cutoff14 = daysAgo(13);
  for (const o of orders) {
    if (o.createdAt < cutoff14) continue;
    const key = dayKey(o.createdAt);
    const entry = dailyMap.get(key) ?? { pedidos: 0, ventas: 0, ganancia: 0 };
    entry.pedidos += 1;
    entry.ventas += o.total;
    entry.ganancia += orderNetProfit(o, costMap);
    dailyMap.set(key, entry);
  }
  const dailyRows = Array.from(dailyMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  // Ventas por mes (todo el historial)
  const monthlyMap = new Map<string, { pedidos: number; ventas: number; ganancia: number }>();
  for (const o of orders) {
    const key = monthKey(o.createdAt);
    const entry = monthlyMap.get(key) ?? { pedidos: 0, ventas: 0, ganancia: 0 };
    entry.pedidos += 1;
    entry.ventas += o.total;
    entry.ganancia += orderNetProfit(o, costMap);
    monthlyMap.set(key, entry);
  }
  const monthlyRows = Array.from(monthlyMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  // Productos más vendidos
  const productAgg = new Map<
    string,
    { name: string; category: string; quantity: number; revenue: number; cost: number }
  >();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = productAgg.get(item.productId) ?? {
        name: item.productName,
        category: productCategory.get(item.productId) ?? "—",
        quantity: 0,
        revenue: 0,
        cost: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue += item.price * item.quantity;
      entry.cost += (costMap.get(item.productId) ?? 0) * item.quantity;
      productAgg.set(item.productId, entry);
    }
  }
  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15);

  // Ranking de revendedoras por ganancia neta generada
  const resellerAgg = new Map<
    string,
    { id: string; name: string; code: string; pedidos: number; ventas: number; ganancia: number }
  >();
  for (const o of orders) {
    if (!o.reseller) continue;
    const entry = resellerAgg.get(o.reseller.id) ?? {
      id: o.reseller.id,
      name: o.reseller.name,
      code: o.reseller.code,
      pedidos: 0,
      ventas: 0,
      ganancia: 0,
    };
    entry.pedidos += 1;
    entry.ventas += o.total;
    entry.ganancia += orderNetProfit(o, costMap);
    resellerAgg.set(o.reseller.id, entry);
  }
  const resellerRanking = Array.from(resellerAgg.values())
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 10);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Reportes</h1>
      <p className="mb-6 text-sm text-gray-500">
        La ganancia neta se calcula como ventas − costo de los productos (según el precio de
        costo cargado en cada uno; los que no tienen costo cargado se cuentan sin costo). Las
        ventas registradas como "Venta directa" (mostrador) no se incluyen en estos números: solo
        se usan para descontar stock.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RangeCard title="Hoy" stats={hoy} />
        <RangeCard title="Últimos 7 días" stats={ultimos7} />
        <RangeCard title="Últimos 30 días" stats={ultimos30} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-bold text-gray-900">Margen de ganancia de los productos activos</h2>
          <p className="mb-3 text-xs text-gray-500">
            Promedio de (precio − costo) / precio entre los productos activos que tienen precio de
            costo cargado.
          </p>
          <p className="text-3xl font-bold text-brand-700">{formatMargin(avgProductMargin)}</p>
          {targetMargin != null &&
            (avgProductMargin == null ? (
              <p className="mt-2 text-sm font-medium text-gray-500">
                Objetivo: {targetMargin}% — todavía no se puede calcular el promedio.
              </p>
            ) : avgProductMargin >= targetMargin ? (
              <p className="mt-2 text-sm font-medium text-green-600">
                Objetivo: {targetMargin}% — cumplido (
                {(avgProductMargin - targetMargin).toFixed(1)} puntos por encima)
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-red-600">
                Objetivo: {targetMargin}% — te faltan {(targetMargin - avgProductMargin).toFixed(1)}{" "}
                puntos
              </p>
            ))}
          {targetMargin == null && (
            <p className="mt-2 text-xs text-gray-400">
              Podés fijar un margen objetivo en{" "}
              <Link href="/admin/configuracion" className="text-brand-600 hover:underline">
                Configuración
              </Link>
              .
            </p>
          )}
          {productsWithoutCost > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {productsWithoutCost} producto(s) activo(s) sin precio de costo cargado no se cuentan
              en este promedio.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-bold text-gray-900">Margen de ganancia de las ventas</h2>
          <p className="mb-3 text-xs text-gray-500">
            Ganancia sobre el precio de venta de todo lo vendido hasta el momento (solo considera
            productos con precio de costo cargado).
          </p>
          <p className="text-3xl font-bold text-brand-700">{formatMargin(avgSalesMargin)}</p>

          <div className="mt-4 flex items-center gap-2">
            {(["dia", "semana", "mes"] as MarginPeriod[]).map((p) => (
              <Link
                key={p}
                href={`/admin/reportes?margenPeriodo=${p}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  margenPeriodo === p
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p === "dia" ? "Por día" : p === "semana" ? "Por semana" : "Por mes"}
              </Link>
            ))}
          </div>

          {marginRows.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin ventas todavía.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">{margenPeriodo === "semana" ? "Semana del" : margenPeriodo === "mes" ? "Mes" : "Fecha"}</th>
                  <th className="pb-2">Vendido</th>
                  <th className="pb-2">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marginRows.map((r) => (
                  <tr key={r.key}>
                    <td className="py-1.5">{r.key}</td>
                    <td className="py-1.5">{formatPrice(r.ventas)}</td>
                    <td className="py-1.5 text-brand-700">{formatMargin(r.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-gray-900">Ventas por día (últimos 14 días)</h2>
          {dailyRows.length === 0 ? (
            <p className="text-sm text-gray-500">Sin ventas todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Pedidos</th>
                  <th className="pb-2">Ventas</th>
                  <th className="pb-2">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyRows.map(([date, s]) => (
                  <tr key={date}>
                    <td className="py-1.5">{date}</td>
                    <td className="py-1.5">{s.pedidos}</td>
                    <td className="py-1.5">{formatPrice(s.ventas)}</td>
                    <td className="py-1.5 text-brand-700">{formatPrice(s.ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-gray-900">Ventas por mes</h2>
          {monthlyRows.length === 0 ? (
            <p className="text-sm text-gray-500">Sin ventas todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Mes</th>
                  <th className="pb-2">Pedidos</th>
                  <th className="pb-2">Ventas</th>
                  <th className="pb-2">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyRows.map(([month, s]) => (
                  <tr key={month}>
                    <td className="py-1.5">{month}</td>
                    <td className="py-1.5">{s.pedidos}</td>
                    <td className="py-1.5">{formatPrice(s.ventas)}</td>
                    <td className="py-1.5 text-brand-700">{formatPrice(s.ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Productos más vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Categoría</th>
                  <th className="pb-2">Cantidad</th>
                  <th className="pb-2">Monto vendido</th>
                  <th className="pb-2">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-medium text-gray-900">{p.name}</td>
                    <td className="py-1.5 text-gray-500">{p.category}</td>
                    <td className="py-1.5">{p.quantity}</td>
                    <td className="py-1.5">{formatPrice(p.revenue)}</td>
                    <td className="py-1.5 text-brand-700">{formatPrice(p.revenue - p.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Ranking de revendedoras por ganancia generada</h2>
          <Link href="/admin/revendedoras" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>
        {resellerRanking.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas todavía.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 text-sm">
            {resellerRanking.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <Link
                    href={`/admin/revendedoras/${r.id}`}
                    className="font-medium text-gray-900 hover:text-brand-700 hover:underline"
                  >
                    {r.name}
                  </Link>
                  <p className="text-gray-500">
                    Código {r.code} · {r.pedidos} venta(s) · {formatPrice(r.ventas)} vendidos
                  </p>
                </div>
                <p className="font-semibold text-brand-700">{formatPrice(r.ganancia)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RangeCard({
  title,
  stats,
}: {
  title: string;
  stats: { pedidos: number; ventas: number; ganancia: number };
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{formatPrice(stats.ventas)}</p>
      <p className="mt-1 text-sm text-gray-500">{stats.pedidos} pedido(s)</p>
      <p className="mt-1 text-sm font-semibold text-brand-700">
        Ganancia neta: {formatPrice(stats.ganancia)}
      </p>
    </div>
  );
}
