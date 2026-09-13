"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CartIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { NavPanel } from "./nav-panel";
import { SearchSurface } from "./search-surface";
import { AccountPanel } from "./account-panel";
import { MobileTabs } from "./mobile-tabs";
import { MobileSheet } from "./mobile-sheet";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { D, EASE_LUXE, springSnap } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { LocaleSwitcher } from "./locale-switcher";
import { Wordmark } from "./announcement-strip";

function Count({ n, tone = "ink" }: { n: number; tone?: "ink" | "light" }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span
          key={n}
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={springSnap}
          aria-hidden
          className={cn("absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[8px] font-bold", tone === "light" ? "bg-champagne-3 text-ink" : "bg-ink text-paper")}
        >{n > 99 ? "99+" : n}</motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * The header is now a slim index: the house mark, four doors, and three
 * actions. It stays out of the hero's composition instead of becoming a
 * second announcement band.
 */
export function SiteHeader({ groups, mobileGroups, user, wishlistCount }: { groups: MegaGroup[]; mobileGroups: NavUniverse[]; user: SafeUser | null; wishlistCount: number }) {
  const { count, open: openCart } = useCart();
  const { copy } = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prevPath, setPrevPath] = useState(pathname);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setActiveId(null);
    setSheetOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setActiveId(null); setSearchOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = (id: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveId(id); };
  const schedule = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setActiveId(null), 180); };
  const active = groups.find((g) => g.id === activeId) ?? null;
  const visibleGroups = groups.slice(0, 4);
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink ltr:focus:left-4 rtl:focus:right-4">{copy.meta.skipToContent}</a>
      <header className={cn("site-header-rebuilt fixed inset-x-0 top-0 z-40 transition-all duration-500", scrolled ? "px-3 pt-2.5" : "px-0 pt-0")}>
        <div className={cn("relative mx-auto border-b transition-all duration-500", scrolled ? "max-w-[84rem] border-stone-2/30 bg-cream/90 shadow-soft backdrop-blur-2xl" : "max-w-none border-ink/12 bg-paper/80 backdrop-blur-md")} onMouseLeave={schedule}>
          <div className="container-wide flex h-[4.25rem] items-center gap-5">
            <button onClick={() => setSheetOpen(true)} aria-label={copy.header.menu} aria-expanded={sheetOpen} className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:hidden"><MenuIcon size={19} /></button>
            <div className="shrink-0"><Wordmark size={scrolled ? "sm" : "md"} /></div>
            <span aria-hidden className="hidden h-5 w-px bg-ink/15 lg:block" />
            <nav aria-label="Explorer" className="hidden min-w-0 flex-1 lg:block">
              <ul className="flex items-center gap-5 xl:gap-7">
                {visibleGroups.map((g) => {
                  const on = isOn(g.href);
                  return <li key={g.id}><Link href={g.href} onMouseEnter={() => enter(g.id)} onFocus={() => enter(g.id)} aria-expanded={activeId === g.id} aria-haspopup="true" className={cn("relative block py-5 text-[9.5px] font-bold uppercase tracking-[.18em] transition-colors", activeId === g.id || on ? "text-ink" : "text-muted hover:text-ink")}>{g.label}<span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-px bg-champagne-2 transition-transform duration-300", activeId === g.id || on ? "scale-x-100" : "scale-x-0")} /></Link></li>;
                })}
                <li><Link href="/boutique" className={cn("py-5 text-[9.5px] font-bold uppercase tracking-[.18em] transition-colors hover:text-champagne-2", pathname.startsWith("/boutique") ? "text-ink" : "text-muted")}>Tout voir</Link></li>
              </ul>
            </nav>
            <div className="ml-auto flex items-center gap-0.5">
              <button onClick={() => setSearchOpen(true)} aria-label={copy.header.search} className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:w-auto lg:gap-2 lg:px-2"><SearchIcon size={18} /><span className="hidden text-[9px] font-bold uppercase tracking-[.16em] lg:inline">Chercher</span></button>
              <span className="hidden lg:block"><AccountPanel user={user} /></span>
              <span className="hidden lg:block"><LocaleSwitcher tone="ink" size="sm" /></span>
              <Link href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"} aria-label={wishlistCount ? fmt(copy.header.favoritesCount, { n: wishlistCount }) : copy.header.favorites} className="relative hidden h-10 w-10 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:flex"><HeartIcon size={18} /><Count n={wishlistCount} /></Link>
              <button onClick={openCart} data-cart-anchor aria-label={count ? fmt(copy.header.cartCount, { n: count }) : copy.header.cart} className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-champagne-2"><CartIcon size={18} /><Count n={count} /></button>
            </div>
          </div>
          <div className="hidden items-center justify-center gap-3 border-t border-ink/8 py-2 lg:flex"><span className="h-px w-4 bg-champagne/70" /><span className="text-[8px] font-bold uppercase tracking-[.24em] text-muted">Conseil pharmaceutique · produits authentiques · livraison partout en Tunisie</span><span className="h-px w-4 bg-champagne/70" /></div>
          <AnimatePresence>
            {active && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: D.fast, ease: EASE_LUXE }} className="absolute inset-x-0 top-full hidden pointer-events-auto lg:block"><NavPanel group={active} onNavigate={() => setActiveId(null)} /></motion.div>}
          </AnimatePresence>
        </div>
      </header>
      <AnimatePresence>{active && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-ink/15" onClick={() => setActiveId(null)} aria-hidden />}</AnimatePresence>
      <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSearch={() => setSearchOpen(true)} universes={mobileGroups} user={user} />
      <MobileTabs onSearch={() => setSearchOpen(true)} />
      <SearchSurface open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
