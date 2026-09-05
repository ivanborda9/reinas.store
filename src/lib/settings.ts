import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const SETTINGS_ID = "singleton";

export const getSiteSettings = cache(async () => {
  try {
    return await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  } catch (err) {
    // Dos requests concurrentes pueden intentar crear la fila única al mismo tiempo;
    // si perdimos la carrera, la fila ya existe: la leemos directamente.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.siteSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
    }
    throw err;
  }
});

export async function updateSiteSettings(data: {
  storeName: string;
  primaryColor: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string | null;
  whatsappNumber: string;
  targetMarginPercent: number | null;
  transferAlias: string;
  transferHolderName: string;
  transferPhone: string;
}) {
  return prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
}
