import { EXPRESS_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/money";

/**
 * Shipping fees as data, for the manual-order wizard's running total.
 *
 * The authoritative calculation remains `shippingFor()` in `@/lib/money`; this
 * is the same three numbers, exported so a client component can show the
 * operator what the desk will charge *before* anything is written.
 */
export const SHIPPING_FEES_PUBLIC = {
  standard: STANDARD_SHIPPING_FEE,
  express: EXPRESS_SHIPPING_FEE,
  freeThreshold: FREE_SHIPPING_THRESHOLD,
} as const;
