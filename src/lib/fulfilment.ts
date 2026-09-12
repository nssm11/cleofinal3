/**
 * LA PROMESSE DE LIVRAISON (P02) — computed, never declared.
 *
 * The PDP may promise “expédié aujourd’hui” ONLY when all three facts hold:
 * the item is in stock, we are inside office hours (Mon–Sat), and it is before
 * the 14 h counter cut-off. Everything else falls back to an honest, smaller
 * promise. A promise is a stock-and-clock truth, not marketing.
 */
export type ShipPromise = "today" | "tomorrow" | "monday" | "restock";

/** Tunis wall-clock facts for a given instant. Weekday: 1 = Monday … 7 = Sunday. */
export function tunisClock(now = new Date()): { hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Tunis",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[get("weekday").slice(0, 3)] ?? 1;
  return { hour: Number(get("hour")) || 0, minute: Number(get("minute")) || 0, weekday: wd };
}

export const CUTOFF_HOUR = 14;

export function shippingPromise(opts: { stock: number; hour: number; weekday: number }): ShipPromise {
  if (opts.stock <= 0) return "restock"; // never promise 24 h on an empty shelf
  const openDay = opts.weekday >= 1 && opts.weekday <= 6; // Mon–Sat
  if (!openDay) return "monday";
  return opts.hour < CUTOFF_HOUR ? "today" : "tomorrow";
}
