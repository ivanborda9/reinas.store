import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { toggleRewardTierActive, deleteRewardTier } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const [tiers, resellers, orders] = await Promise.all([
    prisma.rewardTier.findMany({ orderBy: { targetAmount: "asc" } }),
    prisma.reseller.findMany({ where: { active: true } }),
    prisma.order.findMany({ where: { status: { not: "CANCELADO" } } }),
  ]);

  const totalsByReseller = new Map<string, number>();
  for (const o of orders) {
    if (!o.resellerId) continue;
    totalsByReseller.set(o.resellerId, (totalsByReseller.get(o.resellerId) ?? 0) + o.total);
  }
  const resellerTotals = resellers.map((r) => totalsByReseller.get(r.id) ?? 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regalos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Objetivos de ventas y premios para las revendedoras. El monto se compara contra el
            total comprado por cada una (sin contar pedidos cancelados).
          </p>
        </div>
        <Link
          href="/admin/regalos/nueva"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo regalo
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {tiers.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Todavía no cargaste ningún regalo.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tiers.map((tier) => {
              const achievedCount = resellerTotals.filter((total) => total >= tier.targetAmount).length;
              return (
                <li key={tier.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tier.title}</p>
                    <p className="text-sm text-gray-500">
                      Objetivo: {formatPrice(tier.targetAmount)}
                      {tier.description && ` · ${tier.description}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {achievedCount} revendedora(s) activa(s) ya lo cumplieron
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        tier.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {tier.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/regalos/${tier.id}/editar`}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleRewardTierActive.bind(null, tier.id, !tier.active)}>
                      <button type="submit" className="text-sm text-gray-600 hover:underline">
                        {tier.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <form action={deleteRewardTier.bind(null, tier.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Eliminar este regalo?"
                        className="text-sm text-red-500 hover:underline"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
