"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseRewardTierForm(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const targetAmount = Number(formData.get("targetAmount") || 0);
  return { title, description, targetAmount };
}

export async function createRewardTier(formData: FormData) {
  const data = parseRewardTierForm(formData);
  if (!data.title || data.targetAmount <= 0) {
    redirect(
      "/admin/regalos/nueva?error=" +
        encodeURIComponent("Completá el nombre del premio y un monto objetivo mayor a 0.")
    );
  }

  await prisma.rewardTier.create({ data });
  revalidatePath("/admin/regalos");
  redirect("/admin/regalos");
}

export async function updateRewardTier(id: string, formData: FormData) {
  const data = parseRewardTierForm(formData);
  if (!data.title || data.targetAmount <= 0) {
    redirect(
      `/admin/regalos/${id}/editar?error=` +
        encodeURIComponent("Completá el nombre del premio y un monto objetivo mayor a 0.")
    );
  }

  await prisma.rewardTier.update({ where: { id }, data });
  revalidatePath("/admin/regalos");
  redirect("/admin/regalos");
}

export async function toggleRewardTierActive(id: string, active: boolean) {
  await prisma.rewardTier.update({ where: { id }, data: { active } });
  revalidatePath("/admin/regalos");
}

export async function deleteRewardTier(id: string) {
  await prisma.rewardTier.delete({ where: { id } });
  revalidatePath("/admin/regalos");
}
