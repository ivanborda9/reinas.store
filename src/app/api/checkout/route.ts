import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderPreference, isMercadoPagoEnabled } from "@/lib/mercadopago";

type CheckoutItem = { productId: string; variantId: string | null; quantity: number };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const resellerCode =
    typeof body?.resellerCode === "string" && body.resellerCode.trim()
      ? body.resellerCode.trim().toUpperCase()
      : null;
  const paymentMethod = body?.paymentMethod === "MERCADOPAGO" ? "MERCADOPAGO" : "WHATSAPP";
  const items: CheckoutItem[] = Array.isArray(body?.items)
    ? body.items
        .filter((i: any) => typeof i?.productId === "string" && Number(i?.quantity) > 0)
        .map((i: any) => ({
          productId: i.productId,
          variantId: typeof i?.variantId === "string" && i.variantId ? i.variantId : null,
          quantity: Math.floor(Number(i.quantity)),
        }))
    : [];

  if (items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }
  if (!resellerCode) {
    return NextResponse.json(
      { error: "Ingresá el código de tu revendedora para poder finalizar la compra." },
      { status: 400 }
    );
  }
  if (paymentMethod === "MERCADOPAGO" && !isMercadoPagoEnabled()) {
    return NextResponse.json(
      { error: "El pago con Mercado Pago no está disponible en este momento." },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const variantIds = items.map((i) => i.variantId).filter((id): id is string => Boolean(id));
      const variants = variantIds.length
        ? await tx.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      let subtotal = 0;
      const orderItemsData = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product || !product.active) {
          throw new Error(`Producto no disponible: ${item.productId}`);
        }

        const variant = item.variantId ? variantMap.get(item.variantId) : null;
        if (item.variantId && (!variant || variant.productId !== product.id)) {
          throw new Error(`La variante elegida de "${product.name}" ya no está disponible.`);
        }

        const availableStock = variant ? variant.stock : product.stock;
        if (availableStock < item.quantity) {
          throw new Error(`Sin stock suficiente de "${product.name}".`);
        }

        subtotal += product.price * item.quantity;
        return {
          productId: product.id,
          productName: product.name,
          variantId: variant?.id ?? null,
          variantColor: variant?.color ?? null,
          variantSize: variant?.size ?? null,
          price: product.price,
          quantity: item.quantity,
        };
      });

      const reseller = await tx.reseller.findFirst({ where: { code: resellerCode, active: true } });
      if (!reseller) {
        throw new Error("El código de revendedora ingresado no es válido.");
      }

      const discountAmount = reseller.discountActive
        ? Math.round(subtotal * (reseller.discountPercent / 100))
        : 0;
      const total = subtotal - discountAmount;

      const createdOrder = await tx.order.create({
        data: {
          customerName: reseller.name,
          customerPhone: reseller.phone || "",
          customerAddress: reseller.city || "",
          notes: notes || null,
          subtotal,
          discountAmount,
          total,
          resellerId: reseller?.id ?? null,
          paymentMethod,
          items: { create: orderItemsData },
        },
        include: { items: true, reseller: true },
      });

      for (const item of orderItemsData) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return createdOrder;
    });

    if (paymentMethod === "MERCADOPAGO") {
      try {
        const { preferenceId, checkoutUrl } = await createOrderPreference({
          orderId: order.id,
          title: `Pedido #${order.id.slice(-6).toUpperCase()}`,
          total: order.total,
          baseUrl: req.nextUrl.origin,
        });
        await prisma.order.update({ where: { id: order.id }, data: { mpPreferenceId: preferenceId } });
        return NextResponse.json({ orderId: order.id, checkoutUrl });
      } catch (mpError) {
        console.error("Error creando la preferencia de Mercado Pago:", mpError);
        // El pedido ya está creado y el stock reservado: dejamos que coordine el pago
        // por WhatsApp en vez de perder la venta.
        return NextResponse.json({ orderId: order.id });
      }
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
