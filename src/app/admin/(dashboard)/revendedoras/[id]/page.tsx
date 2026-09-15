import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, OrderStatus } from "@/lib/format";
import { buildCostMap, buildResellerStats } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ResellerDetailPage({ params }: { params: { id: string } }) {
  const reseller = await prisma.reseller.findUnique({ where: { id: params.id } });
  if (!reseller) notFound();

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { resellerId: reseller.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ select: { id: true, costPrice: true } }),
  ]);

  const costMap = buildCostMap(products);
  const stats = buildResellerStats(reseller, orders, costMap);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{reseller.name}</h1>
          <p className="text-sm text-gray-500">
            Código <span className="font-mono text-brand-700">{reseller.code}</span>
            {reseller.city && ` · ${reseller.city}`}
            {reseller.phone && ` · ${reseller.phone}`}
          </p>
        </div>
        <Link
          href={`/admin/revendedoras/${reseller.id}/editar`}
          className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          Editar
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Ventas" value={String(stats.salesCount)} />
        <StatCard label="Monto vendido" value={formatPrice(stats.totalSales)} />
        <StatCard label="Ganancia generada" value={formatPrice(stats.netProfitGenerated)} highlight />
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Artículos vendidos</h2>
        {stats.products.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no vendió ningún artículo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2">Cantidad</th>
                <th className="pb-2">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.products.map((p, i) => (
                <tr key={i}>
                  <td className="py-1.5 font-medium text-gray-900">{p.name}</td>
                  <td className="py-1.5">{p.quantity}</td>
                  <td className="py-1.5">{formatPrice(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Pedidos</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no tiene pedidos.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <div>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-medium text-gray-900 hover:text-brand-700 hover:underline"
                  >
                    Pedido #{o.id.slice(-6).toUpperCase()}
                  </Link>
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
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-brand-200 bg-brand-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className={`text-xs uppercase tracking-wide ${highlight ? "text-brand-700" : "text-gray-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-brand-700" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
