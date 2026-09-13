"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { RegistreChrome } from "./chrome";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";

/**
 * THE TWO SIGNS OF THE HOUSE.
 *
 * Every page wears the standing sign of the maison (SiteHeader). The homepage
 * alone is a drawn section of the house, and it wears the coupe chrome
 * instead: a thin plaque that collects the floor you are on, a brass
 * wayfinder down the margin, a level dial on phones. One rule picks between
 * them — `pathname === "/"` — and both keep the same commerce organs: search,
 * account, wishlist, tray, language.
 */
export function HeaderFrame({
  groups,
  mobileGroups,
  user,
  wishlistCount,
}: {
  groups: MegaGroup[];
  mobileGroups: NavUniverse[];
  user: SafeUser | null;
  wishlistCount: number;
}) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <RegistreChrome universes={mobileGroups} user={user} wishlistCount={wishlistCount} />;
  }
  return <SiteHeader groups={groups} mobileGroups={mobileGroups} user={user} wishlistCount={wishlistCount} />;
}
