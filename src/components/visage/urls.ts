/**
 * LE FIL DES PARAMÈTRES — pure query-string algebra for the Visage workspace.
 *
 * The URL stays the single source of truth (the house rule of the shelf):
 * a chip, a sort, a page is a <link> the server can render. Nothing here is
 * client state; nothing here mutates anything outside /univers/visage.
 */

export type RawSP = Record<string, string | string[] | undefined>;

export const BASE = "/univers/visage";

/** Build a workspace href from the current query, with patches applied. */
export function hrefWith(sp: RawSP, patch: Record<string, string | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v !== "") u.set(k, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) u.delete(k);
    else u.set(k, v);
  }
  // Any change other than paging resets to page one — exactly how the
  // house listing treats a new filter.
  if (patch.page === undefined) u.delete("page");
  const qs = u.toString();
  return `${BASE}${qs ? `?${qs}` : ""}`;
}

/** Toggle one value inside a comma-separated multi-select param. */
export function toggleCsvHref(sp: RawSP, key: string, value: string): string {
  const set = new Set(String(sp[key] ?? "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return hrefWith(sp, { [key]: set.size ? [...set].join(",") : null });
}

/** The concern chips: a need turns the shelf into the filtered full rayon. */
export function toggleConcernHref(sp: RawSP, slug: string): string {
  const set = new Set(String(sp["concerns"] ?? "").split(",").filter(Boolean));
  const next = new Set(set);
  if (next.has(slug)) next.delete(slug);
  else next.add(slug);
  return hrefWith(sp, { all: "1", concerns: next.size ? [...next].join(",") : null });
}

/** A removable active filter, as label + href — computed on the server. */
export type Chip = { label: string; href: string };

export function activeChips(
  sp: RawSP,
  names: { brands: Map<string, string>; concerns: Map<string, string> },
  tolLabels: Record<string, string>,
): { chips: Chip[]; clearHref: string; count: number } {
  const chips: Chip[] = [];
  for (const v of String(sp["brands"] ?? "").split(",").filter(Boolean)) {
    chips.push({ label: names.brands.get(v) ?? v.replace(/-/g, " "), href: toggleCsvHref(sp, "brands", v) });
  }
  for (const v of String(sp["concerns"] ?? "").split(",").filter(Boolean)) {
    chips.push({ label: names.concerns.get(v) ?? v.replace(/-/g, " "), href: toggleCsvHref(sp, "concerns", v) });
  }
  for (const v of String(sp["tol"] ?? "").split(",").filter(Boolean)) {
    chips.push({ label: tolLabels[v] ?? v, href: toggleCsvHref(sp, "tol", v) });
  }
  if (typeof sp["stock"] === "string" && sp["stock"] !== "") {
    chips.push({ label: "En stock", href: hrefWith(sp, { stock: null }) });
  }
  if (typeof sp["promo"] === "string" && sp["promo"] !== "") {
    chips.push({ label: "En promotion", href: hrefWith(sp, { promo: null }) });
  }
  if (typeof sp["rating"] === "string" && sp["rating"] !== "") {
    chips.push({ label: `${sp["rating"]}★ et plus`, href: hrefWith(sp, { rating: null }) });
  }
  if (typeof sp["q"] === "string" && sp["q"].trim() !== "") {
    chips.push({ label: `« ${sp["q"].trim()} »`, href: hrefWith(sp, { q: null }) });
  }
  const min = typeof sp["min"] === "string" ? sp["min"] : "";
  const max = typeof sp["max"] === "string" ? sp["max"] : "";
  if (min || max) {
    chips.push({ label: "Prix ajusté", href: hrefWith(sp, { min: null, max: null }) });
  }
  return { chips, clearHref: BASE, count: chips.length };
}

/** Labels for the verified tolerances — the shelf chips and the drawer speak
 *  the same words, so a chip can be removed with the same name it arrived. */
export const TOL_LABELS: Record<string, string> = {
  sansParfum: "Sans parfum",
  grossesse: "Compatible grossesse",
  peauAtopique: "Peaux à tendance atopique",
  yeuxSensibles: "Yeux sensibles",
};
