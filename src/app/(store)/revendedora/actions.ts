"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateUniqueResellerCode } from "@/lib/resellerCode";
import {
  RESELLER_SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  createResellerSessionToken,
} from "@/lib/auth";

function setResellerCookie(token: string) {
  cookies().set(RESELLER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export async function registerReseller(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !city || password.length < 6) {
    redirect(
      "/revendedora/registro?error=" +
        encodeURIComponent(
          "Completá tu nombre, email, localidad y una contraseña de al menos 6 caracteres."
        )
    );
  }

  const existing = await prisma.reseller.findUnique({ where: { email } });
  if (existing) {
    redirect(
      "/revendedora/registro?error=" + encodeURIComponent("Ya existe una cuenta con ese email.")
    );
  }

  const code = await generateUniqueResellerCode(name);
  const passwordHash = await hashPassword(password);

  let reseller;
  try {
    reseller = await prisma.reseller.create({
      data: {
        name,
        email,
        phone: phone || null,
        city,
        code,
        passwordHash,
        discountPercent: 0,
        active: false,
      },
    });
  } catch {
    redirect(
      "/revendedora/registro?error=" + encodeURIComponent("Ya existe una cuenta con ese email.")
    );
  }

  const token = await createResellerSessionToken(reseller.id);
  setResellerCookie(token);
  redirect("/revendedora/panel");
}

export async function loginReseller(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  const reseller = await prisma.reseller.findUnique({ where: { email } });

  if (!reseller || !reseller.passwordHash || !(await verifyPassword(password, reseller.passwordHash))) {
    redirect("/revendedora/login?error=1");
  }

  const token = await createResellerSessionToken(reseller.id);
  setResellerCookie(token);
  redirect("/revendedora/panel");
}

export async function logoutReseller() {
  cookies().delete(RESELLER_SESSION_COOKIE_NAME);
  redirect("/revendedora/login");
}
