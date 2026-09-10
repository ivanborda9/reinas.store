const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

export function formatVariantLabel(
  color?: string | null,
  size?: string | null
): string | null {
  const parts: string[] = [];
  if (color) parts.push(color);
  if (size) parts.push(`Talle ${size}`);
  return parts.length > 0 ? parts.join(" / ") : null;
}

export const ORDER_STATUSES = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "CANCELADO"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  CANCELADO: "Cancelado",
};
