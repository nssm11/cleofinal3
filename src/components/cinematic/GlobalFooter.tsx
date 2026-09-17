"use client";

import { CinematicFooter, type FooterStore } from "./CinematicFooter";

/**
 * GlobalFooter — the credits, on every page.
 *
 * The homepage ends with its own obsidian section, but the footer is the
 * house's signature and belongs at the bottom of every route: it is the one
 * place where the name appears at scale.
 */
export function GlobalFooter({ stores }: { stores: FooterStore[] }) {
  return <CinematicFooter stores={stores} />;
}
