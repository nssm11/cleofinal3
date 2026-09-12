/**
 * Pure merchandising arithmetic (P01). No db, no react — so the rules that
 * decide what a shopper sees can be read, and tested, on their own.
 */

/**
 * Seasonal windows are expressed as months because that is how a pharmacy
 * thinks (“le solaire, d’avril à septembre”). A window whose start month is
 * after its end month wraps the new year — Oct → Mar is dry-skin season.
 */
export function monthWindowActive(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth === endMonth) return month === startMonth;
  return startMonth < endMonth ? month >= startMonth && month <= endMonth : month >= startMonth || month <= endMonth;
}

/** The month number of a date, in the shop’s timezone context (Europe/Tunis). */
export function tunisMonth(date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { month: "numeric", timeZone: "Africa/Tunis" }).format(date));
}

/** A duo earns its discount only when every member line is in the cart. */
export function duoComplete<T extends { productId: number; quantity: number }>(
  lines: T[],
  memberProductIds: number[],
  perLineQty = 1,
): boolean {
  return memberProductIds.every((id) => {
    const line = lines.find((l) => l.productId === id);
    return !!line && line.quantity >= perLineQty;
  });
}

/** Cap: a bundle discount can never exceed what the cart actually contains. */
export function clampDiscount(discount: number, subtotal: number): number {
  return Math.max(0, Math.min(discount, subtotal));
}
