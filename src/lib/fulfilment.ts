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

/**
 * CLICK & COLLECT — “prêt sous 2 h” is a promise with conditions, so compute
 * them: inside office hours (Mon–Sat, before 18 h 30 so the two hours end
 * before closing) the clock starts now; otherwise at the next open morning.
 * The parcel then waits 48 h before it goes back to the shelf.
 */
export function pickupWindow(now = new Date()): { readyAt: Date; holdUntil: Date } {
  const { hour, minute, weekday } = tunisClock(now);
  const mins = hour * 60 + minute;
  const OPEN = 8 * 60 + 30;
  const LAST_START = 18 * 60 + 30;
  const openDay = weekday >= 1 && weekday <= 6;
  let start: Date;
  if (openDay && mins <= LAST_START) {
    start = new Date(now.getTime() + (Math.max(mins, OPEN) - mins) * 60_000);
  } else {
    const days = weekday >= 6 ? 8 - weekday : 1 - weekday;
    start = new Date(now.getTime() + days * 86_400_000 + (OPEN - mins) * 60_000);
  }
  const readyAt = new Date(start.getTime() + 2 * 3_600_000);
  return { readyAt, holdUntil: new Date(readyAt.getTime() + 48 * 3_600_000) };
}
