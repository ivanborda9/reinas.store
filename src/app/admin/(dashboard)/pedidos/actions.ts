"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/format";

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = String(formData.get("status") || "");
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || order.status === status) return;

    // Cancelar libera el stock reservado; reactivar un pedido cancelado lo vuelve a reservar.
    // Si la variante ya no existe (se borró desde el admin), no hay nada que ajustar.
    if (status === "CANCELADO" && order.status !== "CANCELADO") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant
            .update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
            .catch(() => {});
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    } else if (status !== "CANCELADO" && order.status === "CANCELADO") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant
            .update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } })
            .catch(() => {});
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    await tx.order.update({ where: { id }, data: { status } });
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");
}

type ManualSaleItem = { productId: string; variantId: string | null; quantity: number };

function parseManualSaleItems(formData: FormData): ManualSaleItem[] {
  let parsed: unknown[] = [];
  try {
    parsed = JSON.parse(String(formData.get("itemsJson") || "[]"));
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((i: any) => typeof i?.productId === "string" && i.productId && Number(i?.quantity) > 0)
    .map((i: any) => ({
      productId: i.productId,
      variantId: typeof i?.variantId === "string" && i.variantId ? i.variantId : null,
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
    }));
}

export async function registerManualSale(formData: FormData) {
  const customerName = String(formData.get("customerName") || "").trim() || "Venta mostrador";
  const items = parseManualSaleItems(formData);

  if (items.length === 0) {
    redirect(`/admin/pedidos/nueva?error=${encodeURIComponent("Agregá al menos un producto vendido.")}`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const variantIds = items.map((i) => i.variantId).filter((id): id is string => Boolean(id));
      const variants = variantIds.length
        ? await tx.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      let subtotal = 0;
      const orderItemsData = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) throw new Error("Uno de los productos elegidos ya no existe.");

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

      await tx.order.create({
        data: {
          customerName,
          customerPhone: "",
          customerAddress: "Venta en el local",
          subtotal,
          discountAmount: 0,
          total: subtotal,
          status: "CONFIRMADO",
          paymentMethod: "MOSTRADOR",
          items: { create: orderItemsData },
        },
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo registrar la venta.";
    redirect(`/admin/pedidos/nueva?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/pedidos");
}

export async function deleteCancelledOrder(id: string) {
  // Por seguridad, solo se puede borrar un pedido que ya esté cancelado
  // (el stock ya se liberó al cancelarlo, así que no hay nada más que revertir).
  await prisma.order.deleteMany({ where: { id, status: "CANCELADO" } });
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}
