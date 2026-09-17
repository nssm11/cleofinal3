"use client";

import { usePathname } from "next/navigation";
import { CinematicFooter, type FooterStore } from "./CinematicFooter";

export function GlobalFooter({ stores }: { stores: FooterStore[] }) {
  const pathname = usePathname();
  // Homepage already has its own footer composition if needed, but we now show everywhere for Swiss consistency
  return <CinematicFooter stores={stores} />;
}
