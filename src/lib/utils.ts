export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("fr-TN", opts).format(new Date(d));
}
export function formatDateTime(d: Date | string) {
  return formatDate(d, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
/**
 * Return `v` only if it is a well-formed HTTPS URL — for database-stored
 * external links (maps, …). Anything else renders as no link at all.
 */
export function safeHttpsUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * Serialize structured data for a `<script type="application/ld+json">` tag.
 * Database-controlled strings can contain `</script>`; escaping every `<`
 * as `\u003c` keeps the JSON valid while making tag breakout impossible.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  // Formula-injection guard: Excel/LibreOffice execute cells that begin with
  // = + - @ (or a leading tab/CR) as formulas, and customer-controlled data —
  // names, notes, addresses, promo codes — reaches these exports. A leading
  // apostrophe neutralises the cell: invisible in the spreadsheet, harmless in
  // raw text. Numeric cells are never strings here, so real negative figures
  // keep their sign.
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
