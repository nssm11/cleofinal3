import type { Locale } from "@/lib/i18n/config";
import type { LText } from "@/db/schema";

/**
 * LText is the shape staff type for merchandising copy that must exist in all
 * three tongues but only *needs* the French to render: an absent `tn`/`tna`
 * falls back to `fr` rather than blanking the UI. Names on a card stay proper
 * nouns in every locale (same rule as the catalogue), so this is only ever used
 * for the advice, badges, bundle names and reasons the office writes.
 */
export function pickLText(t: LText | null | undefined, locale: Locale): string {
  if (!t) return "";
  if (locale === "tn") return t.tn?.trim() || t.fr;
  if (locale === "tn-arab") return t.tna?.trim() || t.tn?.trim() || t.fr;
  return t.fr;
}

/** A short, safe LText value clamped to the field-box’s budget; blanks collapse to null. */
export function normLText(fr: string, tn?: string, tna?: string, max = 160): LText {
  const clean = (s?: string) => (s ?? "").trim().slice(0, max);
  const out: LText = { fr: clean(fr) };
  const t = clean(tn);
  const a = clean(tna);
  if (t && t !== out.fr) out.tn = t;
  if (a && a !== t && a !== out.fr) out.tna = a;
  return out;
}
