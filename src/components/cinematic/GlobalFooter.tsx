"use client";

import { usePathname } from "next/navigation";
import { CinematicFooter, type FooterStore } from "./CinematicFooter";

/**
 * GlobalFooter — the credits, on every page but the film itself.
 *
 * The homepage renders its own CinematicFooter as its final section, so this
 * route-aware shell stays quiet there and closes every other page with the
 * same noir end-title.
 */
export function GlobalFooter({ stores }: { stores: FooterStore[] }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <CinematicFooter stores={stores} />;
}
