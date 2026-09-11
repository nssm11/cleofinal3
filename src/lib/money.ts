/** All money is stored as integer millimes. 1 DT = 1000 millimes. */
export type Millimes = number;

export const FREE_SHIPPING_THRESHOLD: Millimes = 99_000;
export const STANDARD_SHIPPING_FEE: Millimes = 7_000;
export const EXPRESS_SHIPPING_FEE: Millimes = 12_000;
export const GIFT_WRAP_FEE: Millimes = 5_000;

const fmt = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export function formatDT(millimes: Millimes): string {
  return `${fmt.format(millimes / 1000)} DT`;
}

export function formatDTShort(millimes: Millimes): string {
  const dt = millimes / 1000;
  return Number.isInteger(dt) ? `${dt} DT` : formatDT(millimes);
}

export function discountPercent(price: Millimes, compareAt?: Millimes | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export type ShippingMethod = "standard" | "express" | "pickup";

export function shippingFor(subtotal: Millimes, method: ShippingMethod = "standard"): Millimes {
  if (method === "pickup") return 0;
  if (method === "express") return EXPRESS_SHIPPING_FEE;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}

export function remainingForFreeShipping(subtotal: Millimes): Millimes {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

/**
 * Loyalty economy — 1 DT spent earns 10 points (10 DT = 100, 100 DT = 1000),
 * and 1000 points redeem for a 10 DT discount, i.e. 1 point = 10 millimes.
 * Earning and redemption are two ends of the same rate.
 */
export const LOYALTY_POINTS_PER_DT = 10;
export const LOYALTY_POINT_MILLIMES: Millimes = 10; // 1000 points = 10 DT

export function loyaltyPointsFor(total: Millimes): number {
  return Math.floor(total / 1000) * LOYALTY_POINTS_PER_DT; // 10 points per 1 DT
}

/** Discount obtained by redeeming `points` (1000 points = 10 DT). */
export function loyaltyDiscountFor(points: number): Millimes {
  return Math.max(0, points) * LOYALTY_POINT_MILLIMES;
}
