/**
 * L'ICONOGRAPHIE — the single address book of the house's pictures.
 *
 * Every photograph on the site and in the letters resolves through this
 * module, so a future move (a CDN origin, renamed folders, a new fallback)
 * is one edit, not a hunt. This file is client-safe: pure strings, no
 * secrets, no environment reads. The e-mail variants that need the public
 * origin live in `media-email.ts`, which is server-only by construction.
 */

/** Canonical `sizes` for every frame the house hangs a photograph in. */
export const MEDIA_SIZES = {
  /** Product grid plate (2 → 4 columns). */
  card: "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw",
  /** Editorial feature statement. */
  feature: "(max-width: 1024px) 100vw, 45vw",
  /** Compact rail row. */
  leaf: "80px",
  /** Small thumbs: search rails, duo offers. */
  thumb: "64px",
  /** Gallery rail on the product page. */
  rail: "86px",
  /** Cart line. */
  cart: "150px",
  /** Product theatre plate. */
  gallery: "(max-width:1024px) 100vw, 54vw",
  /** Full-screen viewing. */
  lightbox: "90vw",
} as const;

/** The plate hung whenever a photograph is missing or unreachable. */
export const PRODUCT_PLACEHOLDER_SRC = "/images/placeholder.svg";

/**
 * A breath of marble behind every photograph while it develops — a 12 px
 * tile, blurred by the browser into the shelf's own ground.
 */
export const PRODUCT_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Crect width='12' height='12' fill='%23e9e1cd'/%3E%3C/svg%3E";

/** True for absolute URLs (any scheme, or protocol-relative) — never prefixed. */
export function isAbsoluteMediaUrl(src: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src.trim());
}

/**
 * The one choke point for catalogue imagery: trims, empties to null, and
 * passes everything else through untouched. Local paths stay relative (the
 * CDN origin, if one ever fronts them, is applied here alone).
 */
export function resolveProductImage(src: string | null | undefined): string | null {
  if (typeof src !== "string") return null;
  const clean = src.trim();
  return clean.length > 0 ? clean : null;
}

/** The caption a screen reader hears when a plate carries no authored alt. */
export function productImageAlt(name: string, brandName?: string | null): string {
  return brandName ? `${name} — ${brandName}` : name;
}
