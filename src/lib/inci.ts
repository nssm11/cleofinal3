import { ALIASES, ACTIVES, fold } from "./actives-dictionary";

/**
 * L'INCI, lu pour de vrai.
 *
 * A formula is a list, and a list can be read. Everything the shop claims about
 * a tube — « sans parfum », « contient du limonène », « renferme de la
 * niacinamide » — is decided here, from the text of the formula, so the claim
 * can never drift away from the label.
 *
 * Two rules:
 *  · Nothing is asserted about a formula the shop does not have. `null` in,
 *    `null` out — the fiche then says « non communiquée », which is a fact.
 *  · A claim is positive. « Sans parfum » is only ever printed when the text
 *    has been read and no fragrance term is in it.
 */

/** The 26 fragrance allergens that must be declared on a cosmetic label. */
export const FRAGRANCE_ALLERGENS = [
  "Amyl Cinnamal", "Amylcinnamyl Alcohol", "Anise Alcohol", "Benzyl Alcohol", "Benzyl Benzoate",
  "Benzyl Cinnamate", "Benzyl Salicylate", "Butylphenyl Methylpropional", "Cinnamal", "Cinnamyl Alcohol",
  "Citral", "Citronellol", "Coumarin", "Eugenol", "Evernia Furfuracea", "Evernia Prunastri",
  "Farnesol", "Geraniol", "Hexyl Cinnamal", "Hydroxycitronellal", "Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde",
  "Isoeugenol", "Limonene", "Linalool", "Methyl 2-Octynoate", "Alpha-Isomethyl Ionone",
];

/** Terms that mean "this has a perfume in it", whatever the marketing says. */
const FRAGRANCE_TERMS = ["parfum", "fragrance", "aroma", "parfum naturel", ...FRAGRANCE_ALLERGENS];

/** Other things a customer genuinely needs to hear about. */
const WATCHED = [
  { label: "Lanoline", terms: ["lanolin"] },
  { label: "Nickel (traces possibles)", terms: ["nickel"] },
  { label: "Alcool", terms: ["alcohol denat", "alcohol denat.", "sd alcohol"] },
  { label: "Silicones", terms: ["dimethicone", "cyclopentasiloxane", "siloxane"] },
  { label: "Sulfates", terms: ["sodium lauryl sulfate", "sls", "sodium laureth sulfate"] },
  { label: "Huiles essentielles", terms: ["essential oil", "huile essentielle"] },
  { label: "Conservateurs (parabènes)", terms: ["paraben", "methylparaben", "propylparaben", "phenoxyethanol"] },
];

/** Split a formula string into its ingredients, dropping the trailing notes. */
export function parseInci(text: string | null | undefined): string[] {
  if (!text) return [];
  const body = text.split(/\n{2,}|\.\s*(?=[A-ZÉ])/)[0] ?? text;
  return body
    .replace(/^\s*(ingr[ée]dients?|composition|inci|formule)\s*:?\s*/i, "")
    .replace(/\([^)]*\)/g, " ")
    .split(/[,;•·]/)
    .map((x) => x.trim().replace(/\s+/g, " "))
    .filter((x) => x.length > 1 && !/^(sans|without|peut contenir|may contain)/i.test(x))
    .map((x) => x.replace(/\s*\.$/, ""));
}

/** The allergen list actually present, in the order the label declares them. */
export function allergensIn(text: string | null | undefined): string[] {
  const parts = parseInci(text);
  if (!parts.length) return [];
  const found: string[] = [];
  for (const part of parts) {
    const f = fold(part);
    const hit = FRAGRANCE_ALLERGENS.find((a) => fold(a) === f);
    if (hit && !found.includes(hit)) found.push(hit);
  }
  return found;
}

/**
 * « Sans parfum » — decided, not typed. Null when there is no formula to read:
 * an absent claim and a true claim are not the same thing.
 */
export function isFragranceFree(text: string | null | undefined): boolean | null {
  const parts = parseInci(text);
  if (!parts.length) return null;
  const flat = fold(parts.join(" "));
  return !FRAGRANCE_TERMS.some((t) => flat.includes(fold(t)));
}

/** Everything else the counter should be able to say without reading Latin. */
export function watchedIn(text: string | null | undefined): string[] {
  const parts = parseInci(text);
  if (!parts.length) return [];
  const flat = fold(parts.join(" "));
  return WATCHED.filter((w) => w.terms.some((t) => flat.includes(fold(t)))).map((w) => w.label);
}

/**
 * Which of the shop's known actives are in this formula. Uses the same alias
 * table as the glossary, so a formula and a glossary page can never disagree.
 */
export function activesIn(text: string | null | undefined, limit = 8): string[] {
  const flat = fold(text ?? "");
  if (!flat) return [];
  const variants = new Map<string, string[]>();
  for (const [variant, slug] of Object.entries(ALIASES)) {
    const list = variants.get(slug) ?? [];
    list.push(variant);
    variants.set(slug, list);
  }
  const found: string[] = [];
  for (const active of ACTIVES) {
    const words = [active.label, ...(variants.get(active.slug) ?? [])];
    const hit = words.some((w) => w.length >= 4 && flat.includes(fold(w)));
    if (hit) found.push(active.label);
    if (found.length >= limit) break;
  }
  return found;
}

/** A one-line reading of a formula, for a fiche that has one but no time. */
export function readFormula(text: string | null | undefined): {
  count: number;
  allergens: string[];
  watched: string[];
  fragranceFree: boolean | null;
} {
  const parts = parseInci(text);
  return { count: parts.length, allergens: allergensIn(text), watched: watchedIn(text), fragranceFree: isFragranceFree(text) };
}

/**
 * A fingerprint of a formula, so the shop can see that 74 fiches share one.
 * Sorted, folded, first ten ingredients — two lists with the same ten are the
 * same list for the purpose of asking the question.
 */
export function formulaFingerprint(text: string | null | undefined): string | null {
  const parts = parseInci(text).map((p) => fold(p)).sort();
  if (!parts.length) return null;
  return parts.slice(0, 10).join("|").slice(0, 300);
}
