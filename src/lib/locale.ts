import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n";

/**
 * The chosen language lives in a cookie rather than the URL: the catalogue has
 * one slug per product and duplicating every route for a second language would
 * split the SEO of every page. One cookie, one `router.refresh()`, and the
 * whole shell re-renders in the other language.
 */
export const LOCALE_COOKIE = "cleo_lang";
const LOCALE_COOKIE_DAYS = 365;

export async function readLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeCookieOptions() {
  return {
    path: "/",
    maxAge: LOCALE_COOKIE_DAYS * 24 * 3600,
    httpOnly: false, // the switcher is a plain form; no secret lives here
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
