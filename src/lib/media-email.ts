import "server-only";
import { SITE_URL } from "@/lib/env";
import { isAbsoluteMediaUrl } from "@/lib/media";

/**
 * LES VARIANTES POSTALES — the e-mail faces of the house's pictures.
 *
 * Mail clients block relative URLs, so every image and link a letter carries
 * is absolutized here. Both builders are idempotent: an already-absolute URL
 * passes through untouched, which means the letter parts can apply them
 * defensively and a caller can never double-prefix by accident.
 */
export function emailAsset(path: string): string {
  const clean = path.trim();
  if (isAbsoluteMediaUrl(clean)) return clean;
  return `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

export function emailLink(path: string): string {
  const clean = path.trim();
  if (isAbsoluteMediaUrl(clean)) return clean;
  return `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`;
}
