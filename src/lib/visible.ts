/**
 * IS IT ON SCREEN? — the geometric half of the entrance system.
 *
 * Deliberately pure: a rectangle and a viewport height in, a boolean out. No
 * observer, no library, no DOM beyond the two numbers the caller measures. This
 * is the check that guarantees an entrance block can always be shown, whatever
 * the observers are doing, so it is worth being able to test it on its own.
 */
export type Rect = { top: number; bottom: number; width: number; height: number };

/**
 * @param rect           the block's own bounding rectangle
 * @param viewportHeight the visible height, in the same coordinate space
 * @param lead           how far below the fold a block still counts as arriving
 *                       (0.06 → it starts a little before it is seen)
 */
export function isOnScreen(rect: Rect, viewportHeight: number, lead = 0.06): boolean {
  // No viewport, no answer. Better to leave the observer to decide.
  if (!(viewportHeight > 0)) return false;
  // A block with no box at all has not been laid out yet; judging it now would
  // reveal it before it has a position, which is exactly the flash we avoid.
  if (rect.width === 0 && rect.height === 0) return false;

  // Note what is *not* measured: the block's height. A plate taller than the
  // viewport is still "arriving" the moment its top edge crosses the line —
  // requiring a fraction of it to be visible is what used to leave tall
  // compositions permanently empty.
  return rect.top < viewportHeight * (1 + lead);
}
