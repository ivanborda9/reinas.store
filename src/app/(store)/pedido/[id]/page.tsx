import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatVariantLabel } from "@/lib/format";
import { buildWhatsappOrderLink } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/settings";
import { getMercadoPagoPayment, mapMercadoPagoStatus } from "@/lib/mercadopago";
import { RetryPaymentButton } from "@/components/RetryPaymentButton";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { payment_id?: string };
}) {
  let order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, reseller: true },
  });

  if (!order) notFound();

  // MP redirige acá antes de que llegue la notificación del webhook: si tenemos el
  // payment_id, confirmamos el estado real contra la API de Mercado Pago al toque
  // en vez de esperar. Nunca confiamos en el "status" que viene por la URL.
  if (order.paymentMethod === "MERCADOPAGO" && order.paymentStatus === "PENDIENTE" && searchParams.payment_id) {
    try {
      const payment = await getMercadoPagoPayment(searchParams.payment_id);
      if (payment.external_reference === order.id) {
        const paymentStatus = mapMercadoPagoStatus(payment.status);
        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus,
            mpPaymentId: String(payment.id ?? ""),
            ...(paymentStatus === "APROBADO" && order.status === "PENDIENTE"
              ? { status: "CONFIRMADO" }
              : {}),
          },
          include: { items: true, reseller: true },
        });
      }
    } catch {
      // Si falla, nos quedamos con el estado actual; el webhook lo va a actualizar después.
    }
  }

  const settings = await getSiteSettings();

  const whatsappLink = buildWhatsappOrderLink({
    orderId: order.id,
    customerName: order.customerName,
    items: order.items,
    total: order.total,
    resellerCode: order.reseller?.code,
    whatsappNumber: settings.whatsappNumber,
  });

  const isMercadoPago = order.paymentMethod === "MERCADOPAGO";
  const header = isMercadoPago
    ? {
        APROBADO: { icon: "✓", color: "green", title: "¡Pago aprobado!" },
        RECHAZADO: { icon: "✕", color: "red", title: "El pago fue rechazado" },
        PENDIENTE: { icon: "…", color: "yellow", title: "Tu pago está siendo procesado" },
      }[order.paymentStatus] ?? { icon: "✓", color: "green", title: "¡Gracias por tu compra!" }
    : { icon: "✓", color: "green", title: "¡Gracias por tu compra!" };

  const colorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${colorClasses[header.color]}`}
      >
        {header.icon}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
      <p className="mt-2 text-gray-500">
        {isMercadoPago && order.paymentStatus === "RECHAZADO"
          ? `Pedido #${order.id.slice(-6).toUpperCase()}: el pago no se pudo procesar. Podés reintentar con otra tarjeta o coordinar por WhatsApp.`
          : isMercadoPago && order.paymentStatus === "PENDIENTE"
            ? `Pedido #${order.id.slice(-6).toUpperCase()} recibido. Te vamos a avisar apenas se confirme el pago.`
            : `Pedido #${order.id.slice(-6).toUpperCase()} recibido.`}
      </p>

      {!isMercadoPago && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-5 text-left">
          <h2 className="mb-2 font-bold text-brand-900">Datos para transferir</h2>
          <p className="text-sm text-gray-700">
            Alias: <span className="font-semibold">{settings.transferAlias}</span>
          </p>
          <p className="text-sm text-gray-700">
            Titular: <span className="font-semibold">{settings.transferHolderName}</span>
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Después enviá el comprobante por WhatsApp al{" "}
            <span className="font-semibold">{settings.transferPhone}</span>.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-left">
        <ul className="flex flex-col gap-2 text-sm">
          {order.items.map((i) => {
            const variantLabel = formatVariantLabel(i.variantColor, i.variantSize);
            return (
              <li key={i.id} className="flex justify-between text-gray-700">
                <span>
                  {i.quantity}x {i.productName}
                  {variantLabel && <span className="text-gray-500"> ({variantLabel})</span>}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-2 text-gray-700">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento {order.reseller ? `(${order.reseller.code})` : ""}</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {isMercadoPago && order.paymentStatus === "RECHAZADO" && (
          <RetryPaymentButton orderId={order.id} />
        )}
        {settings.whatsappNumber && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700"
          >
            Coordinar por WhatsApp
          </a>
        )}
        <Link
          href="/"
          className="rounded-lg border border-brand-600 px-5 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
