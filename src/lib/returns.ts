/**
 * THE SEVEN DAYS — the return window, computed in one place so the page, the
 * action and the copy can never disagree. Policy (and /livraison says the
 * same): 7 days from receipt, product unopened. We refuse only what we can
 * actually measure: without a recorded delivery moment the window is open.
 */

export const RETURN_WINDOW_DAYS = 7;

export type ReturnWindow = { open: boolean; daysLeft: number };

export function returnWindow(deliveredAt: Date | null, now: Date): ReturnWindow {
  if (!deliveredAt) return { open: true, daysLeft: RETURN_WINDOW_DAYS };
  const elapsedDays = (now.getTime() - deliveredAt.getTime()) / 86_400_000;
  if (elapsedDays >= RETURN_WINDOW_DAYS) return { open: false, daysLeft: 0 };
  return { open: true, daysLeft: RETURN_WINDOW_DAYS - Math.floor(elapsedDays) };
}
