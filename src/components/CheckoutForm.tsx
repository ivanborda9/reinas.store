"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

type CodeState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid"; name: string; discountPercent: number }
  | { status: "invalid"; message: string };

export function CheckoutForm() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<CodeState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discountAmount = useMemo(() => {
    if (codeState.status === "valid") {
      return Math.round(subtotal * (codeState.discountPercent / 100));
    }
    return 0;
  }, [codeState, subtotal]);

  const total = subtotal - discountAmount;

  async function checkCode() {
    if (!code.trim()) {
      setCodeState({ status: "idle" });
      return;
    }
    setCodeState({ status: "checking" });
    try {
      const res = await fetch("/api/codigo/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCodeState({ status: "valid", name: data.name, discountPercent: data.discountPercent });
      } else {
        setCodeState({ status: "invalid", message: data.message || "Código no válido." });
      }
    } catch {
      setCodeState({ status: "invalid", message: "No se pudo validar el código." });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (codeState.status !== "valid") {
      setError("Ingresá y validá tu código de revendedora para poder finalizar la compra.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          resellerCode: code,
          paymentMethod: "WHATSAPP",
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo procesar el pedido.");
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/pedido/${data.orderId}`);
    } catch {
      setError("No se pudo procesar el pedido. Intentá nuevamente.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">No tenés productos en el carrito</h1>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:col-span-2">
        <h1 className="text-2xl font-bold text-gray-900">Finalizar compra</h1>

        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <label className="mb-1 block text-sm font-medium text-brand-800">
            Tu código de revendedora (obligatorio)
          </label>
          <div className="flex gap-2">
            <input
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeState({ status: "idle" });
              }}
              placeholder="Ej: ANA10"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 uppercase"
            />
            <button
              type="button"
              onClick={checkCode}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
            >
              Validar
            </button>
          </div>
          <p className="mt-2 text-xs text-brand-700">
            Ingresá tu código de revendedora para comprar a precio mayorista.
          </p>
          {codeState.status === "checking" && (
            <p className="mt-2 text-sm text-brand-700">Validando...</p>
          )}
          {codeState.status === "valid" && (
            <p className="mt-2 text-sm font-medium text-green-700">
              {codeState.discountPercent > 0
                ? `¡Código de ${codeState.name} aplicado! ${codeState.discountPercent}% de descuento.`
                : `Código de ${codeState.name} aplicado. Por el momento no tenés descuento aplicado.`}
            </p>
          )}
          {codeState.status === "invalid" && (
            <p className="mt-2 text-sm font-medium text-red-600">{codeState.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nota del pedido (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: aclaraciones sobre el envío, urgencia, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={2}
          />
        </div>

        <div className="rounded-lg border border-gray-300 px-4 py-3">
          <span className="text-sm">
            <span className="font-medium text-gray-900">Forma de pago: efectivo / transferencia</span>
            <br />
            <span className="text-gray-500">
              Después de confirmar el pedido te mostramos los datos para transferir.
            </span>
          </span>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || codeState.status !== "valid"}
          className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:bg-gray-300"
        >
          {submitting ? "Procesando..." : "Confirmar pedido"}
        </button>
        {codeState.status !== "valid" && (
          <p className="text-xs text-gray-500">
            Validá tu código de revendedora arriba para poder continuar.
          </p>
        )}
      </form>

      <div className="h-fit rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Resumen del pedido</h2>
        <ul className="mb-3 flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between text-gray-700">
              <span>
                {i.quantity}x {i.name}
              </span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-700">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
