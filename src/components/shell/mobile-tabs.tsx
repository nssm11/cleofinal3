"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BoxesIcon, HeartIcon, HomeIcon, SearchIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { springSnap } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LA BARRE — the thumb bar.
   ──────────────────────────────────────────────────────────────────────────
   Phones are held, not pointed at. Five repeated gestures live under the
   thumb: home, the rayons, search, favourites, the account. The active marker
   is a single cinabre hairline that travels between entries with the house's
   own spring — one moving part, which is what makes the bar feel alive
   without ever drawing attention to itself.
   ══════════════════════════════════════════════════════════════════════════ */

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
      <div className="mx-3 mb-3 flex items-stretch border border-rule-strong/50 bg-alabaster/92 shadow-float backdrop-blur-2xl">
        {ITEMS.slice(0, 2).map((item) => (
          <Tab key={item.href} item={item} pathname={pathname} reduce={!!reduce} />
        ))}

        <button
          type="button"
          onClick={onSearch}
          aria-label="Rechercher"
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1.5 border-x border-rule"
        >
          <SearchIcon size={18} className="text-ash" />
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ash">Chercher</span>
        </button>

        {ITEMS.slice(2).map((item) => (
          <Tab key={item.href} item={item} pathname={pathname} reduce={!!reduce} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  item,
  pathname,
  reduce,
}: {
  item: (typeof ITEMS)[number];
  pathname: string;
  reduce: boolean;
}) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1.5"
    >
      <Icon size={18} className={cn("transition-colors duration-300", active ? "text-ink" : "text-ash")} />
      <span
        className={cn(
          "font-mono text-[0.5625rem] uppercase tracking-[0.12em] transition-colors duration-300",
          active ? "text-ink" : "text-ash",
        )}
      >
        {item.label}
      </span>
      {active &&
        (reduce ? (
          <span aria-hidden className="absolute inset-x-4 top-0 h-px bg-cinabre" />
        ) : (
          <motion.span
            layoutId="tab-mark"
            transition={springSnap}
            className="absolute inset-x-4 top-0 h-px bg-cinabre"
          />
        ))}
    </Link>
  );
}
