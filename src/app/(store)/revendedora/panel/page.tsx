import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentReseller } from "@/lib/resellerSession";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, OrderStatus } from "@/lib/format";
import { buildRewardProgress } from "@/lib/reports";
import { logoutReseller } from "../actions";

export const dynamic = "force-dynamic";

export default async function RevendedoraPanelPage() {
  const reseller = await getCurrentReseller();
  if (!reseller) redirect("/revendedora/login");

  const [orders, tiers] = await Promise.all([
    prisma.order.findMany({
      where: { resellerId: reseller.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rewardTier.findMany({ where: { active: true } }),
  ]);

  const activeOrders = orders.filter((o) => o.status !== "CANCELADO");
  const totalCompras = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const rewardProgress = buildRewardProgress(totalCompras, tiers);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {reseller.name}</h1>
          <p className="text-sm text-gray-500">
            Tu código: <span className="font-mono font-semibold text-brand-700">{reseller.code}</span>
          </p>
        </div>
        <form action={logoutReseller}>
          <button type="submit" className="text-sm text-red-500 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </div>

      {!reseller.active && (
        <p className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Tu cuenta está pendiente de aprobación. En cuanto el negocio la active, tu código va a
          empezar a funcionar en el checkout.
        </p>
      )}
      {reseller.active && !reseller.discountActive && (
        <p className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Tu descuento para comprar a precio mayorista está deshabilitado temporalmente por el
          administrador. Tu código sigue funcionando, solo que sin descuento por ahora.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Compras realizadas</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{activeOrders.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Monto comprado</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatPrice(totalCompras)}</p>
        </div>
      </div>

      {rewardProgress.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-gray-900">Regalos</h2>
          <ul className="flex flex-col gap-4">
            {rewardProgress.map((tier) => (
              <li key={tier.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{tier.title}</span>
                  {tier.achieved ? (
                    <span className="font-semibold text-green-600">¡Cumplido!</span>
                  ) : (
                    <span className="text-gray-500">
                      Te faltan {formatPrice(tier.remaining)} de {formatPrice(tier.targetAmount)}
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="mb-1 text-xs text-gray-500">{tier.description}</p>
                )}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${tier.achieved ? "bg-green-500" : "bg-brand-500"}`}
                    style={{ width: `${tier.progressPercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-gray-900">Tus compras</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no compraste nada. Usá tu código <strong>{reseller.code}</strong> en el checkout
            cuando quieras comprar a precio mayorista para revender.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">
                    Pedido #{o.id.slice(-6).toUpperCase()}
                  </p>
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
