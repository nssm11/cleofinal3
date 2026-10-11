import type { Tint } from "@/data/types";

/**
 * Tint palettes — the silent-era practice of dyeing each scene by mood
 * (amber for day, blue for night, green for the uncanny, red for fire,
 * violet for dreams, sepia for memory). Every poster, card and hero plate
 * borrows from this set, so the whole archive shares one chromatic logic.
 */
export interface TintPalette {
  /** field top (lighter, where the "dye" is thickest) */
  field: string;
  /** field bottom (deepening toward black) */
  deep: string;
  /** foreground: lines, type, art */
  fg: string;
  /** secondary accent for a single point of contrast */
  accent: string;
  /** text on field, muted */
  faint: string;
}

export const TINT_PALETTE: Record<Tint, TintPalette> = {
  amber: { field: "#96631b", deep: "#3c2507", fg: "#f6e9c8", accent: "#c65233", faint: "#e0c389" },
  blue: { field: "#314d66", deep: "#101c28", fg: "#e4edf4", accent: "#d99a2b", faint: "#9db6c9" },
  green: { field: "#47613d", deep: "#15220f", fg: "#eaf0dc", accent: "#c65233", faint: "#a8bd93" },
  red: { field: "#7e3120", deep: "#2b0d06", fg: "#f4e3d0", accent: "#e8a33d", faint: "#cf9b82" },
  sepia: { field: "#7d582f", deep: "#2e1e0b", fg: "#f0e4ca", accent: "#c65233", faint: "#c2a97f" },
  violet: { field: "#4b3b60", deep: "#191322", fg: "#eae2f2", accent: "#e8a33d", faint: "#a893bd" },
};
