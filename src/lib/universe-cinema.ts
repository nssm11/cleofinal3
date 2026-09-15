/**
 * UNIVERSE CINEMA — the film's chapter per universe.
 *
 * Every universe continues the homepage: the same footage family that opens
 * its chapter on the film now opens the universe page fullscreen. Base file
 * names only — the desktop and mobile sources are derived, exactly as the
 * homepage does it (`category-skin` → `category-skin.mp4` +
 * `category-skin-mobile.mp4`, poster at `/videos/posters/skin.jpg`).
 */
export type UniverseCinema = {
  /** Base video name without extension. */
  video: string;
  /** Poster base name, from /videos/posters. */
  poster: string;
  /** The film's micro-caps for this chapter. */
  kicker: string;
  /** The statement set in the display face over the frame. */
  title: string;
};

export const UNIVERSE_CINEMA: Record<string, UniverseCinema> = {
  visage: { video: "category-skin", poster: "skin", kicker: "SKIN", title: "The art of the ritual." },
  cheveux: { video: "category-hair", poster: "hair", kicker: "HAIR", title: "Strength and beauty." },
  corps: { video: "category-body", poster: "body", kicker: "BODY", title: "Care in every detail." },
  solaire: { video: "category-sun", poster: "sun", kicker: "SUN", title: "Protection with elegance." },
  "bebe-maman": { video: "category-baby", poster: "baby", kicker: "BABY", title: "Gentle essentials." },
};
