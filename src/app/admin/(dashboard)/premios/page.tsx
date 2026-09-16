import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { argentinaWeekKey, argentinaWeekRangeFromKey, shiftWeekKey } from "@/lib/reports";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { toggleRewardTierActive, deleteRewardTier } from "./actions";

export const dynamic = "force-dynamic";

function formatWeekLabel(key: string): string {
  const { start } = argentinaWeekRangeFromKey(key);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  return `Semana del ${fmt(start)} al ${fmt(end)}`;
}

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: { semana?: string };
}) {
  const currentWeekKey = argentinaWeekKey(new Date());
  const selectedWeekKey = searchParams.semana || currentWeekKey;
  const { start: weekStart, end: weekEnd } = argentinaWeekRangeFromKey(selectedWeekKey);

  const [tiers, resellers, orders] = await Promise.all([
    prisma.rewardTier.findMany({ orderBy: { targetAmount: "asc" } }),
    prisma.reseller.findMany({ where: { active: true } }),
    prisma.order.findMany({
      where: { status: { not: "CANCELADO" }, createdAt: { gte: weekStart, lt: weekEnd } },
    }),
  ]);

  const totalsByReseller = new Map<string, number>();
  for (const o of orders) {
    if (!o.resellerId) continue;
    totalsByReseller.set(o.resellerId, (totalsByReseller.get(o.resellerId) ?? 0) + o.total);
  }

  const tierResults = tiers.map((tier) => ({
    tier,
    achievers: resellers
      .map((r) => ({ reseller: r, total: totalsByReseller.get(r.id) ?? 0 }))
      .filter((x) => x.total >= tier.targetAmount)
      .sort((a, b) => b.total - a.total),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Premios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Los objetivos son semanales (lunes a domingo): se comparan contra lo que compró cada
            revendedora esa semana (sin contar pedidos cancelados).
          </p>
        </div>
        <Link
          href="/admin/premios/nueva"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo premio
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <Link
          href={`/admin/premios?semana=${shiftWeekKey(selectedWeekKey, -1)}`}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ‹ Semana anterior
        </Link>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{formatWeekLabel(selectedWeekKey)}</p>
          {selectedWeekKey !== currentWeekKey && (
            <Link href="/admin/premios" className="text-xs text-brand-600 hover:underline">
              Volver a esta semana
            </Link>
          )}
        </div>
        <Link
          href={`/admin/premios?semana=${shiftWeekKey(selectedWeekKey, 1)}`}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Semana siguiente ›
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4">
        {tierResults.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Todavía no cargaste ningún premio.
          </p>
        ) : (
          tierResults.map(({ tier, achievers }) => (
            <div key={tier.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{tier.title}</p>
                  <p className="text-sm text-gray-500">
                    Objetivo: {formatPrice(tier.targetAmount)}
                    {tier.description && ` · ${tier.description}`}
                  </p>
                </div>
                {!tier.active && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                    Inactivo
                  </span>
                )}
              </div>
              {achievers.length === 0 ? (
                <p className="text-sm text-gray-500">Ninguna revendedora llegó a este objetivo esta semana.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100 text-sm">
                  {achievers.map(({ reseller: r, total }) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <div>
                        <Link
                          href={`/admin/revendedoras/${r.id}`}
                          className="font-medium text-gray-900 hover:text-brand-700 hover:underline"
                        >
                          {r.name}
                        </Link>
                        <p className="text-gray-500">
                          Código {r.code}
                          {r.phone && ` · ${r.phone}`}
                        </p>
                      </div>
                      <p className="font-semibold text-green-600">{formatPrice(total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mb-3 text-sm font-semibold text-gray-700">Premios configurados</div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {tiers.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Todavía no cargaste ningún premio.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tiers.map((tier) => (
              <li key={tier.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tier.title}</p>
                  <p className="text-sm text-gray-500">
                    Objetivo: {formatPrice(tier.targetAmount)}
                    {tier.description && ` · ${tier.description}`}
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
                    href={`/admin/premios/${tier.id}/editar`}
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
                      confirmMessage="¿Eliminar este premio?"
                      className="text-sm text-red-500 hover:underline"
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
