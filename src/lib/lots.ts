/**
 * Les lots, en clair.
 *
 * A pharmacy's stock is not a number on a product row — it is a shelf of dated
 * boxes. Everything that decides *which box leaves first* is decided here, in
 * one pure place, so the rule can be read, argued with, and tested without a
 * database.
 *
 * The rules, in order of authority:
 *
 *  1. An expired lot is never sold. Not "sold with a warning" — never.
 *  2. An undated lot is never sold. Nobody can vouch for it, so it waits for a
 *     human to type the date. This is the difference between an honest shop and
 *     a fast one.
 *  3. First Expired, First Out: the earliest date leaves the shelf first. The
 *     warehouse does not get to keep the fresh boxes while the near ones sit.
 *  4. Among lots of the same date, the shelf comes before the reserve, because
 *     the counter can actually reach it.
 *
 * Nothing here throws on a shortage: it returns what it could take and how much
 * is missing, and the caller decides whether that is an error (checkout) or a
 * question for the counter.
 */

export const DAY_MS = 86_400_000;

/** Days before expiry at which the office wants to hear about a lot. */
export const WATCH_DAYS = 90;
/** Days before expiry at which the lot is urgent. */
export const CRITICAL_DAYS = 30;

export type LotStatus = "sale" | "quarantine" | "destroyed" | "returned";
export type LotPlace = "shelf" | "back";

export type LotLike = {
  id: number;
  lot: string;
  /** Null means « DLC non communiquée » — a real state, not a missing value. */
  expiresAt: Date | string | null;
  quantity: number;
  status: LotStatus;
  placed?: LotPlace;
  storeId?: number;
};

export type ExpiryState = "expired" | "critical" | "watch" | "ok" | "undated";

const toDate = (v: Date | string | null | undefined): Date | null => {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Whole days from `now` to the date. Negative = already past. Null = undated. */
export function daysUntil(expiresAt: Date | string | null | undefined, now: Date = new Date()): number | null {
  const d = toDate(expiresAt);
  if (!d) return null;
  return Math.ceil((d.getTime() - now.getTime()) / DAY_MS);
}

export function expiryState(expiresAt: Date | string | null | undefined, now: Date = new Date()): ExpiryState {
  const days = daysUntil(expiresAt, now);
  if (days === null) return "undated";
  if (days < 0) return "expired";
  if (days <= CRITICAL_DAYS) return "critical";
  if (days <= WATCH_DAYS) return "watch";
  return "ok";
}

const STATE_WORDS: Record<ExpiryState, string> = {
  expired: "périmé",
  critical: "moins d'un mois",
  watch: "moins de trois mois",
  ok: "date confortable",
  undated: "DLC non communiquée",
};

/** The words the counter and the customer read. Never a number without them. */
export function expiryWords(state: ExpiryState): string {
  return STATE_WORDS[state];
}

/** Only this lot may be sold: in stock, dated, not expired, not quarantined. */
export function isSellable(lot: LotLike, now: Date = new Date()): boolean {
  if (lot.status !== "sale" || lot.quantity <= 0) return false;
  const days = daysUntil(lot.expiresAt, now);
  return days !== null && days >= 0;
}

/** The stock a customer can actually be served from. */
export function sellableUnits(lots: readonly LotLike[], now: Date = new Date()): number {
  let n = 0;
  for (const l of lots) if (isSellable(l, now)) n += l.quantity;
  return n;
}

/** Units that exist but cannot be sold yet — divided by *why*, never merged. */
export function unsellableUnits(lots: readonly LotLike[], now: Date = new Date()): { expired: number; undated: number; held: number } {
  const out = { expired: 0, undated: 0, held: 0 };
  for (const l of lots) {
    if (l.quantity <= 0) continue;
    if (l.status !== "sale") { out.held += l.quantity; continue; }
    const days = daysUntil(l.expiresAt, now);
    if (days === null) out.undated += l.quantity;
    else if (days < 0) out.expired += l.quantity;
  }
  return out;
}

export type LotPick<T extends LotLike> = { lot: T; take: number };

/**
 * FEFO. Takes `quantity` units out of the shelf, earliest date first, and says
 * what it could not take rather than pretending.
 */
export function chooseLots<T extends LotLike>(
  lots: readonly T[],
  quantity: number,
  now: Date = new Date(),
): { picks: LotPick<T>[]; short: number } {
  const wanted = Math.max(0, Math.floor(quantity));
  const order = lots
    .filter((l) => isSellable(l, now))
    .slice()
    .sort((a, b) => {
      const da = toDate(a.expiresAt)!.getTime();
      const db = toDate(b.expiresAt)!.getTime();
      if (da !== db) return da - db;
      const pa = a.placed === "shelf" ? 0 : 1;
      const pb = b.placed === "shelf" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.id - b.id;
    });

  const picks: LotPick<T>[] = [];
  let left = wanted;
  for (const lot of order) {
    if (left <= 0) break;
    const take = Math.min(left, lot.quantity);
    picks.push({ lot, take });
    left -= take;
  }
  return { picks, short: left };
}

/** The earliest date the counter could promise, or null if nothing is datable. */
export function earliestExpiry(lots: readonly LotLike[], now: Date = new Date()): Date | null {
  let best: Date | null = null;
  for (const l of lots) if (isSellable(l, now)) {
    const d = toDate(l.expiresAt)!;
    if (!best || d < best) best = d;
  }
  return best;
}

/**
 * Lots that must be pulled from the shelf right now: past their date, still
 * flagged `sale`.
 */
export function toQuarantine<T extends LotLike>(lots: readonly T[], now: Date = new Date()): T[] {
  return lots.filter((l) => l.status === "sale" && (daysUntil(l.expiresAt, now) ?? 1) < 0 && l.quantity > 0);
}

/** Lots worth telling the office about: soon, and still on the shelf. */
export function expiringSoon<T extends LotLike>(lots: readonly T[], now: Date = new Date(), withinDays = WATCH_DAYS): T[] {
  return lots
    .filter((l) => {
      if (l.status !== "sale" || l.quantity <= 0) return false;
      const d = daysUntil(l.expiresAt, now);
      return d !== null && d >= 0 && d <= withinDays;
    })
    .sort((a, b) => toDate(a.expiresAt)!.getTime() - toDate(b.expiresAt)!.getTime());
}

/** Lots nobody has dated. They exist, they count, they cannot be sold. */
export function undatedLots<T extends LotLike>(lots: readonly T[]): T[] {
  return lots.filter((l) => l.quantity > 0 && daysUntil(l.expiresAt) === null);
}

/** « 12/2027 » — the short form the receipt and the shelf label use. */
export function lotMonthLabel(expiresAt: Date | string | null | undefined): string {
  const d = toDate(expiresAt);
  if (!d) return "DLC non communiquée";
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${month}/${d.getUTCFullYear()}`;
}

/** The one line that goes on a packing slip or an invoice. */
export function lotLine(lot: { lot: string; expiresAt: Date | string | null } | null | undefined): string | null {
  if (!lot) return null;
  return `Lot ${lot.lot} — ${lotMonthLabel(lot.expiresAt)}`;
}
