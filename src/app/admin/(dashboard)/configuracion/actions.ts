"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateSiteSettings } from "@/lib/settings";
import { isValidHexColor } from "@/lib/colors";

export async function saveSiteSettings(formData: FormData) {
  const storeName = String(formData.get("storeName") || "").trim() || "Mi Catálogo";
  const primaryColorRaw = String(formData.get("primaryColor") || "").trim();
  const primaryColor = isValidHexColor(primaryColorRaw) ? primaryColorRaw : "#db2777";
  const bannerTitle = String(formData.get("bannerTitle") || "").trim();
  const bannerSubtitle = String(formData.get("bannerSubtitle") || "").trim();
  const bannerImageUrl = String(formData.get("bannerImageUrl") || "").trim() || null;
  const whatsappNumber = String(formData.get("whatsappNumber") || "").trim();
  const targetMarginRaw = String(formData.get("targetMarginPercent") || "").trim();
  const targetMarginPercent =
    targetMarginRaw && Number.isFinite(Number(targetMarginRaw)) ? Number(targetMarginRaw) : null;
  const transferAlias = String(formData.get("transferAlias") || "").trim();
  const transferHolderName = String(formData.get("transferHolderName") || "").trim();
  const transferPhone = String(formData.get("transferPhone") || "").trim();

  await updateSiteSettings({
    storeName,
    primaryColor,
    bannerTitle,
    bannerSubtitle,
    bannerImageUrl,
    whatsappNumber,
    targetMarginPercent,
    transferAlias,
    transferHolderName,
    transferPhone,
  });

  revalidatePath("/", "layout");
  redirect("/admin/configuracion?guardado=1");
}
