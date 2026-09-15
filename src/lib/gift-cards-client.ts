/**
 * Gift-card helpers safe for client components: pure formatting and status
 * derivation only. Issuance, lookup and redemption live server-side in
 * `lib/gift-cards.ts` and are never importable from the browser.
 */

export type GiftCardStatus = "active" | "redeemed" | "expired" | "cancelled";

/** The live status: `expired` is derived from the date, never stored stale. */
export function liveStatus(card: { status: string; expiresAt: Date | string | null }): GiftCardStatus {
  if (card.status === "cancelled" || card.status === "redeemed") return card.status;
  if (card.expiresAt && new Date(card.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

/** Normalise customer input: case, spaces and dashes forgiven. */
export function normalizeGiftCardCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]+/g, "");
}
