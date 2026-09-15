import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, formatVariantLabel, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/format";
import { updateOrderStatus } from "../actions";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, reseller: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        Pedido #{order.id.slice(-6).toUpperCase()}
      </h1>
      <p className="mb-6 text-sm text-gray-500">{formatDate(order.createdAt)}</p>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-gray-900">Datos de envío</h2>
        <p className="text-sm text-gray-700">{order.customerName}</p>
        {order.customerPhone && <p className="text-sm text-gray-700">{order.customerPhone}</p>}
        <p className="text-sm text-gray-700">{order.customerAddress}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-gray-900">Revendedora</h2>
          {order.reseller ? (
            <>
              <p className="text-sm text-gray-700">
                {order.reseller.name} ({order.reseller.code})
              </p>
              {order.reseller.phone && <p className="text-sm text-gray-700">{order.reseller.phone}</p>}
              {order.reseller.city && <p className="text-sm text-gray-700">{order.reseller.city}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">Venta directa, sin revendedora.</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-gray-900">Nota del pedido</h2>
          <p className="text-sm text-gray-700">{order.notes || "Sin nota."}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:col-span-2">
          <h2 className="mb-2 font-semibold text-gray-900">Pago</h2>
          <p className="text-sm text-gray-700">
            Método:{" "}
            {order.paymentMethod === "MERCADOPAGO"
              ? "Mercado Pago"
              : order.paymentMethod === "MOSTRADOR"
                ? "Venta directa (mostrador)"
                : "Efectivo / transferencia (WhatsApp)"}
          </p>
          {order.paymentMethod === "MERCADOPAGO" && (
            <p className="text-sm text-gray-700">
              Estado del pago:{" "}
              <span
                className={
                  order.paymentStatus === "APROBADO"
                    ? "font-semibold text-green-700"
                    : order.paymentStatus === "RECHAZADO"
                      ? "font-semibold text-red-600"
                      : "font-semibold text-yellow-700"
                }
              >
                {order.paymentStatus === "APROBADO"
                  ? "Aprobado"
                  : order.paymentStatus === "RECHAZADO"
                    ? "Rechazado"
                    : "Pendiente"}
              </span>
              {order.mpPaymentId && ` · ID de pago: ${order.mpPaymentId}`}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-900">Productos</h2>
        <ul className="flex flex-col divide-y divide-gray-100 text-sm">
          {order.items.map((item) => {
            const variantLabel = formatVariantLabel(item.variantColor, item.variantSize);
            return (
              <li key={item.id} className="flex justify-between py-2">
                <span>
                  {item.quantity}x {item.productName}
                  {variantLabel && <span className="text-gray-500"> ({variantLabel})</span>}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-2 text-sm text-gray-700">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Descuento</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-900">Estado del pedido</h2>
        <form action={updateOrderStatus.bind(null, order.id)} className="flex items-center gap-3">
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
          >
            Actualizar
          </button>
        </form>
      </div>
    </div>
  );
}
