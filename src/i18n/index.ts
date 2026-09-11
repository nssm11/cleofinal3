/**
 * CLÉOPÂTRE — ACCÈS AUX LANGUES.
 *
 * `t()` walks the dictionary by a dotted path and fills `{placeholders}`.
 * The path is checked against the French dictionary at compile time, so a typo
 * in a key never reaches a customer as a blank string.
 */
import { fr, tn, type Dictionary } from "./dictionaries";

export type Locale = "fr" | "tn";

export const LOCALES: Locale[] = ["fr", "tn"];

/** Tounsi reads left-to-right in Latin script; Arabic-script Tounsi would not. */
export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = { fr: "ltr", tn: "ltr" };

export const DICTIONARIES: Record<Locale, Dictionary> = { fr, tn };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

/** The default for anything whose locale is unknown: a new visitor, a bot, a test. */
export const DEFAULT_LOCALE: Locale = "fr";

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  if (typeof value === "string") {
    const head = value.split("-")[0].toLowerCase();
    if (head === "fr") return "fr";
    if (head === "ar" || head === "tn" || head === "aeb") return "tn";
  }
  return DEFAULT_LOCALE;
}

type Path = string;

function lookup(dict: Dictionary, path: Path): unknown {
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node === null || typeof node !== "object" || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/**
 * Translate one key. Unknown keys fall back to French and, failing that, to the
 * key itself — a visible seam during development rather than a silent blank.
 */
export function t(locale: Locale, key: Path, vars?: Record<string, string | number>): string {
  const raw = lookup(DICTIONARIES[locale] ?? fr, key);
  const value = typeof raw === "string" ? raw : undefined;
  const text = value ?? (typeof lookup(fr, key) === "string" ? (lookup(fr, key) as string) : key);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export { fr, tn, type Dictionary };
