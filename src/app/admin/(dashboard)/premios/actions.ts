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
      "/admin/premios/nueva?error=" +
        encodeURIComponent("Completá el nombre del premio y un monto objetivo mayor a 0.")
    );
  }

  await prisma.rewardTier.create({ data });
  revalidatePath("/admin/premios");
  redirect("/admin/premios");
}

export async function updateRewardTier(id: string, formData: FormData) {
  const data = parseRewardTierForm(formData);
  if (!data.title || data.targetAmount <= 0) {
    redirect(
      `/admin/premios/${id}/editar?error=` +
        encodeURIComponent("Completá el nombre del premio y un monto objetivo mayor a 0.")
    );
  }

  await prisma.rewardTier.update({ where: { id }, data });
  revalidatePath("/admin/premios");
  redirect("/admin/premios");
}

export async function toggleRewardTierActive(id: string, active: boolean) {
  await prisma.rewardTier.update({ where: { id }, data: { active } });
  revalidatePath("/admin/premios");
}

export async function deleteRewardTier(id: string) {
  await prisma.rewardTier.delete({ where: { id } });
  revalidatePath("/admin/premios");
}

export async function scheduleRewardTier(weekKey: string, formData: FormData) {
  const rewardTierId = String(formData.get("rewardTierId") || "");
  if (!rewardTierId) return;

  await prisma.rewardSchedule.upsert({
    where: { weekKey_rewardTierId: { weekKey, rewardTierId } },
    update: {},
    create: { weekKey, rewardTierId },
  });
  revalidatePath("/admin/premios");
}

export async function unscheduleRewardTier(scheduleId: string) {
  await prisma.rewardSchedule.delete({ where: { id: scheduleId } });
  revalidatePath("/admin/premios");
}
