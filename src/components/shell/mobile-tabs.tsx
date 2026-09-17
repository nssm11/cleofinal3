"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BoxesIcon, HeartIcon, HomeIcon, SearchIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {D} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";

/**
 * LA TABLETTE — the mobile thumb bar.
 *
 * Phones are held, not pointed at. The destinations a shopper actually repeats
 * — home, the rayons, favourites, their account — therefore live under the
 * thumb instead of inside a drawer, and the bar lifts off the page with a
 * shadow so it never competes with the content behind it.
 *
 * Search keeps its place in the header, where the hand already is.
 */
const ITEMS = [
  { href: "/", label: "Accueil", icon: HomeIcon, exact: true },
  { href: "/boutique", label: "Rayons", icon: BoxesIcon, exact: false },
  { href: "/compte/favoris", label: "Favoris", icon: HeartIcon, exact: false },
  { href: "/compte", label: "Compte", icon: UserIcon, exact: false },
] as const;

export function MobileTabs({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-3 mb-3 flex items-stretch border border-line-strong/30 bg-porcelain/90 px-1 shadow-float backdrop-blur-2xl">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 px-1"
            >
              {active && !reduce && (
                <motion.span
                  layoutId="tab-underline"
                  transition={{ duration: D.fast, ease: EASE }}
                  className="absolute inset-x-3 top-0 h-px bg-iodine"
                />
              )}
              {active && reduce && <span aria-hidden className="absolute inset-x-3 top-0 h-px bg-iodine" />}
              <Icon size={19} className={cn("transition-colors duration-300", active ? "text-carbon" : "text-faint")} />
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.14em] transition-colors duration-300",
                  active ? "text-carbon" : "text-faint",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onSearch}
          aria-label="Rechercher"
          className="relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 px-1"
        >
          <SearchIcon size={19} className="text-faint" />
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-faint">Chercher</span>
        </button>
      </div>
    </nav>
  );
}
