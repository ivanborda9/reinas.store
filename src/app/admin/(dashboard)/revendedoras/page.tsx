import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { buildCostMap, buildResellerStats } from "@/lib/reports";
import { toggleResellerActive, toggleResellerDiscountActive, deleteReseller } from "./actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

type SortKey = "ventas" | "ganancia" | "localidad";

export default async function AdminResellersPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const [resellers, orders, products] = await Promise.all([
    prisma.reseller.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ include: { items: true } }),
    prisma.product.findMany({ select: { id: true, costPrice: true } }),
  ]);

  const costMap = buildCostMap(products);
  const rows = resellers.map((r) => ({ reseller: r, stats: buildResellerStats(r, orders, costMap) }));

  const sort = (searchParams.sort as SortKey) || undefined;
  if (sort === "ventas") {
    rows.sort((a, b) => b.stats.salesCount - a.stats.salesCount);
  } else if (sort === "ganancia") {
    rows.sort((a, b) => b.stats.netProfitGenerated - a.stats.netProfitGenerated);
  } else if (sort === "localidad") {
    rows.sort((a, b) => (a.reseller.city || "").localeCompare(b.reseller.city || ""));
  }

  const sortLink = (key: SortKey, label: string) => (
    <Link
      href={`/admin/revendedoras?sort=${key}`}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        sort === key
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-gray-300 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revendedoras</h1>
        <Link
          href="/admin/revendedoras/nueva"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nueva revendedora
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-gray-500">Ordenar por:</span>
        <Link
          href="/admin/revendedoras"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !sort
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Más recientes
        </Link>
        {sortLink("ventas", "Más ventas")}
        {sortLink("ganancia", "Más ganancia generada")}
        {sortLink("localidad", "Localidad")}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Localidad</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Ventas</th>
              <th className="px-4 py-3">Ventas totales</th>
              <th className="px-4 py-3">Ganancia generada</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ reseller: r, stats }) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/admin/revendedoras/${r.id}`} className="hover:text-brand-700 hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.city || "—"}</td>
                <td className="px-4 py-3 font-mono text-brand-700">{r.code}</td>
                <td className="px-4 py-3">{stats.salesCount}</td>
                <td className="px-4 py-3">{formatPrice(stats.totalSales)}</td>
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {formatPrice(stats.netProfitGenerated)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/revendedoras/${r.id}/editar`} className="text-brand-600 hover:underline">
                      Editar
                    </Link>
                    <form action={toggleResellerActive.bind(null, r.id, !r.active)}>
                      <button type="submit" className="text-gray-600 hover:underline">
                        {r.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <form action={toggleResellerDiscountActive.bind(null, r.id, !r.discountActive)}>
                      <button type="submit" className="text-gray-600 hover:underline">
                        {r.discountActive ? "Deshabilitar descuento" : "Habilitar descuento"}
                      </button>
                    </form>
                    <form action={deleteReseller.bind(null, r.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Eliminar esta revendedora? Si tiene ventas asociadas, se desactivará en su lugar."
                        className="text-red-500 hover:underline"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resellers.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">Todavía no cargaste revendedoras.</p>
        )}
      </div>
    </div>
  );
}
