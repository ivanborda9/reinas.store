"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function parseResellerForm(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    code: String(formData.get("code") || "")
      .trim()
      .toUpperCase(),
    discountPercent: Number(formData.get("discountPercent") || 0),
    password: String(formData.get("password") || ""),
  };
}

export async function createReseller(formData: FormData) {
  const { password, ...data } = parseResellerForm(formData);
  if (!data.code) {
    redirect("/admin/revendedoras/nueva?error=El código es obligatorio.");
  }

  let failed = false;
  try {
    await prisma.reseller.create({
      data: { ...data, passwordHash: password ? await hashPassword(password) : null },
    });
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(`/admin/revendedoras/nueva?error=El código o el email ya está en uso.`);
  }

  revalidatePath("/admin/revendedoras");
  redirect("/admin/revendedoras");
}

export async function updateReseller(id: string, formData: FormData) {
  const { password, ...data } = parseResellerForm(formData);
  await prisma.reseller.update({
    where: { id },
    data: { ...data, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
  });
  revalidatePath("/admin/revendedoras");
  redirect("/admin/revendedoras");
}

export async function toggleResellerActive(id: string, active: boolean) {
  await prisma.reseller.update({ where: { id }, data: { active } });
  revalidatePath("/admin/revendedoras");
}

export async function toggleResellerDiscountActive(id: string, discountActive: boolean) {
  await prisma.reseller.update({ where: { id }, data: { discountActive } });
  revalidatePath("/admin/revendedoras");
}

export async function deleteReseller(id: string) {
  try {
    await prisma.reseller.delete({ where: { id } });
  } catch {
    await prisma.reseller.update({ where: { id }, data: { active: false } });
  }
  revalidatePath("/admin/revendedoras");
}
