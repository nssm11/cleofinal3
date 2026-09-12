"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "./config";

/**
 * Switch the tongue of the house. The cookie is written first (it governs the
 * next render, wherever the visitor is); a signed-in customer's choice is also
 * stored on the account, so the language follows the person across devices.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale as Locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
  });
  const me = await getCurrentUser();
  if (me) await db.update(users).set({ locale }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
}
