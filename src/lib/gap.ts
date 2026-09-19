/**
 * LES PIÈCES QUI COMBLENT — the arithmetic of a free delivery.
 *
 * The house pays the delivery from 99 DT. When a basket sits just under that
 * line, the useful thing to show is not "you might also like" — it is the
 * bottles whose price actually crosses it, cheapest first, so the visitor
 * spends as little as possible to earn it.
 *
 * Kept as a pure function, away from React and away from the database, so the
 * rule can be tested: nothing below the remaining amount (it would not close
 * the gap), nothing already in the basket, nothing out of stock, and never a
 * suggestion at all once the delivery is already free.
 */

export type GapCandidate = { id: number; priceMillimes: number; stock: number };

export function pickGapFillers<T extends GapCandidate>(
  fillers: T[],
  cartProductIds: readonly number[],
  remaining: number,
  limit = 3,
): T[] {
  if (remaining <= 0) return [];
  const inCart = new Set(cartProductIds);
  return fillers
    .filter((f) => f.stock > 0 && !inCart.has(f.id) && f.priceMillimes >= remaining)
    .sort((a, b) => a.priceMillimes - b.priceMillimes)
    .slice(0, limit);
}
