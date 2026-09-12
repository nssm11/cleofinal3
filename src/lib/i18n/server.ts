import "server-only";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { fr } from "./copy/fr";
import { tn } from "./copy/tn";
import { tounsi } from "./copy/tn-arab";
import type { Copy } from "./copy/fr";

/**
 * How a page finds its tongue, in order of precedence:
 *   1. the `?lang=` query override (deep links, e-mails: ?lang=tn);
 *   2. the `cleo_locale` cookie, set by the switcher;
 *   3. the account's stored language (the person's choice outlives the browser);
 *   4. French.
 */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const c = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export const COPY: Record<Locale, Copy> = { fr, tn, "tn-arab": tounsi };

/** Server-component helper: the copy for this request. */
export async function getCopy(): Promise<Copy> {
  return COPY[await getLocale()];
}

/**
 * Resolve the effective locale for a known user (cookies win over the account
 * so a demo account can be browsed in any tongue). Cached — several layouts
 * may ask on one request.
 */
export const resolveUserLocale = cache(async (userId: number | null | undefined, cookieLocale?: Locale): Promise<Locale> => {
  if (cookieLocale) return cookieLocale;
  if (!userId) return getLocale();
  const jar = await cookies();
  const c = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const row = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return isLocale(row[0]?.locale) ? row[0].locale : DEFAULT_LOCALE;
});

export { fmt } from "./config";
