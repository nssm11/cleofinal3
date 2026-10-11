/**
 * Formatting helpers — one voice for numbers and durations across the site.
 * Western numerals throughout (the convention of Arabic entertainment UIs),
 * always tabular via the .nums utility so columns stay aligned.
 */

/** 96 → "96 د" · 134 → "ساعتان و14 د"? No — keep it machine-clean: "134 د". */
export function formatRuntime(minutes: number): string {
  return `${minutes} د`;
}

/** Seconds → h:mm:ss / mm:ss for the player readout. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** 1922 → "١٩٢٢"? No — Arabic UI convention here is Western digits: "1922". */
export function formatYear(year: number): string {
  return String(year);
}

/** "1902–2015" ranges for statistics strips. */
export function formatYearRange(from: number, to: number): string {
  return `${from}–${to}`;
}

/** Deterministic 32-bit string hash — seeds program rotation & art jitter. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable pseudo-random in [0,1) from a seed string + slot. */
export function seededRandom(seed: string, slot = 0): number {
  const h = hashString(`${seed}:${slot}`);
  return h / 0xffffffff;
}
