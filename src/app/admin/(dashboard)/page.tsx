import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, OrderStatus } from "@/lib/format";
import { buildCostMap, orderNetProfit, startOfDay } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, resellers, products, productCount] = await Promise.all([
    prisma.order.findMany({ include: { reseller: true, items: true }, orderBy: { createdAt: "desc" } }),
    prisma.reseller.findMany(),
    prisma.product.findMany({ select: { id: true, costPrice: true } }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const costMap = buildCostMap(products);
  const activeOrders = orders.filter((o) => o.status !== "CANCELADO");
  // Las ventas de mostrador ("MOSTRADOR") solo se registran para descontar stock:
  // no cuentan como ventas ni ganancias de la página.
  const trackedSalesOrders = activeOrders.filter((o) => o.paymentMethod !== "MOSTRADOR");
  const totalSales = trackedSalesOrders.reduce((sum, o) => sum + o.total, 0);
  const totalNetProfit = trackedSalesOrders.reduce((sum, o) => sum + orderNetProfit(o, costMap), 0);
  const recentOrders = orders.slice(0, 8);

  const todayStart = startOfDay(new Date());
  const todayOrders = activeOrders.filter((o) => o.createdAt >= todayStart);
  const todaySalesByReseller = resellers
    .map((r) => {
      const rOrders = todayOrders.filter((o) => o.resellerId === r.id);
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        salesCount: rOrders.length,
        totalSales: rOrders.reduce((sum, o) => sum + o.total, 0),
      };
    })
    .filter((r) => r.salesCount > 0)
    .sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Resumen</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pedidos" value={String(orders.length)} />
        <StatCard label="Ventas totales" value={formatPrice(totalSales)} />
        <StatCard label="Ganancias netas" value={formatPrice(totalNetProfit)} />
        <StatCard label="Productos activos" value={String(productCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-sm text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay pedidos.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{o.customerName}</p>
                    <p className="text-gray-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(o.total)}</p>
                    <p className="text-xs text-gray-500">
                      {ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Ventas de hoy</h2>
            <Link href="/admin/revendedoras" className="text-sm text-brand-600 hover:underline">
              Gestionar
            </Link>
          </div>
          {todaySalesByReseller.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay ventas hoy.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {todaySalesByReseller.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-gray-500">
                      Código {r.code} · {r.salesCount} venta(s)
                    </p>
                  </div>
                  <p className="font-semibold text-brand-700">{formatPrice(r.totalSales)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
