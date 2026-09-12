/**
 * THE TONGUES OF THE HOUSE.
 *
 * Cléopâtre speaks French, and it speaks Tunisian — in both of the scripts
 * Tunisians actually write on the web: Latin darija (the everyday keyboard)
 * and Arabic script (the heritage one, right-to-left). A locale here is one of
 * three keys; everything downstream (dictionary, direction, <html lang>,
 * e-mail copy) derives from it.
 */

export const LOCALES = ["fr", "tn", "tn-arab"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "cleo_locale";
export const DEFAULT_LOCALE: Locale = "fr";

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** Native names — never translated; a language switcher labels in its own tongue. */
export const LOCALE_META: Record<Locale, { name: string; short: string; lang: string; dir: "ltr" | "rtl" }> = {
  fr: { name: "Français", short: "FR", lang: "fr", dir: "ltr" },
  tn: { name: "Tounsi", short: "TN", lang: "aeb-TN", dir: "ltr" },
  "tn-arab": { name: "تونسي", short: "تونسي", lang: "aeb-TN", dir: "rtl" },
};

export const dirFor = (l: Locale): "ltr" | "rtl" => LOCALE_META[l].dir;
export const langFor = (l: Locale): string => LOCALE_META[l].lang;

/** The cookie lives one year; the choice follows the person, not the session. */
export const LOCALE_COOKIE_MAX_AGE = 31_536_000;

export function localeFromUser(userLocale: string | null | undefined): Locale {
  return isLocale(userLocale) ? userLocale : DEFAULT_LOCALE;
}

/** Tiny interpolation for `{n}`-style slots inside dictionary entries. Pure —
 * shared by the server helpers and client components. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}
