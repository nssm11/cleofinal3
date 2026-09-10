"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CartIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { Wordmark, AnnouncementStrip } from "./announcement-strip";
import { NavPanel } from "./nav-panel";
import { SearchSurface } from "./search-surface";
import { AccountPanel } from "./account-panel";
import { MobileTabs } from "./mobile-tabs";
import { MobileSheet } from "./mobile-sheet";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { EASE_LUXE, D, springSnap } from "@/lib/motion";

/**
 * L'ENSEIGNE — the header of the house.
 *
 * One DOM, two states. At the top of a page it is a wide, quiet band that lets
 * the composition breathe underneath it. As soon as the visitor reads downwards
 * it contracts into a floating bar — narrower, lit, lifted off the page — and
 * the announcement strip withdraws entirely.
 *
 * The rail opens full-bleed editorial panels on hover *and* on focus, so the
 * same navigation works for a mouse and for a keyboard.
 */
function Count({ n, tone = "ink" }: { n: number; tone?: "ink" | "light" }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span
          key={n}
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={springSnap}
          aria-hidden
          className={cn(
            "absolute -right-1.5 -top-1 flex h-[17px] min-w-[17px] items-center justify-center px-1 text-[9px] font-bold tabular-nums",
            tone === "light" ? "bg-champagne-3 text-noir" : "bg-champagne-2 text-paper",
          )}
        >
          {n > 99 ? "99+" : n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function SiteHeader({
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
  const { count, open: openCart } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prevPath, setPrevPath] = useState(pathname);

  // A navigation always closes everything: no panel may survive a page change.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setActiveId(null);
    setSheetOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveId(id);
  };
  const schedule = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveId(null), 220);
  };
  const active = groups.find((g) => g.id === activeId) ?? null;

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow-float"
      >
        Aller au contenu
      </a>

      {/* ── The floating shell ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <motion.div
          initial={false}
          animate={{ height: scrolled ? 0 : "auto", opacity: scrolled ? 0 : 1 }}
          transition={{ duration: D.base, ease: EASE_LUXE }}
          className="pointer-events-auto overflow-hidden"
        >
          <AnnouncementStrip collapsed={false} />
        </motion.div>

        <div
          className={cn(
            "pointer-events-auto mx-auto flex items-center gap-3 transition-[max-width,margin,height,background-color,box-shadow,border-color,backdrop-filter] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:gap-5",
            scrolled
              ? "mx-3 mt-2.5 h-14 max-w-[68rem] border border-stone-2/25 bg-cream/85 px-2.5 shadow-soft backdrop-blur-2xl lg:mt-3 lg:px-4"
              : "mx-0 mt-0 h-14 max-w-none border border-transparent bg-transparent px-4 lg:h-[68px] lg:px-9",
          )}
          onMouseLeave={schedule}
        >
          {/* Mobile trigger */}
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={sheetOpen}
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:hidden"
          >
            <MenuIcon />
          </button>

          {/* The name */}
          <motion.div
            initial={false}
            animate={{ scale: scrolled ? 0.9 : 1 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="flex shrink-0 origin-left items-center"
          >
            <Wordmark size={scrolled ? "sm" : "md"} />
          </motion.div>

          {/* The rail — desktop */}
          <nav aria-label="Navigation principale" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-4 xl:gap-6">
              {groups.map((g) => {
                const on = g.href.endsWith(pathname);
                return (
                  <li key={g.id}>
                    <Link
                      href={g.href}
                      onMouseEnter={() => enter(g.id)}
                      onFocus={() => enter(g.id)}
                      aria-expanded={activeId === g.id}
                      aria-haspopup="true"
                      className={cn(
                        "group relative block whitespace-nowrap py-2 text-[10.5px] font-bold uppercase tracking-[0.19em] transition-colors duration-300",
                        activeId === g.id || on ? "text-ink" : "text-muted hover:text-ink",
                      )}
                    >
                      {g.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 bottom-0 h-px origin-center bg-champagne-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          activeId === g.id || on ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* The actions */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className={cn(
                "hidden items-center gap-2.5 rounded-sm border border-stone-2/35 bg-cream/50 text-muted transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne hover:text-ink lg:flex",
                scrolled ? "h-9 w-9 justify-center border-transparent bg-transparent" : "h-10 w-60 justify-start px-3.5 xl:w-72",
              )}
            >
              <SearchIcon size={16} className="shrink-0" />
              {!scrolled && (
                <>
                  <span className="truncate text-[12.5px]">Rechercher dans la maison…</span>
                  <kbd className="ml-auto hidden shrink-0 border border-stone-2/40 px-1.5 py-0.5 text-[9px] tracking-normal xl:inline">
                    ⌘K
                  </kbd>
                </>
              )}
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:hidden"
            >
              <SearchIcon size={19} />
            </button>

            <span className="hidden lg:block">
              <AccountPanel user={user} />
            </span>

            <Link
              href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"}
              aria-label={wishlistCount ? `Favoris, ${wishlistCount} article(s)` : "Favoris"}
              className="relative hidden h-11 w-11 items-center justify-center text-ink transition-colors hover:text-champagne-2 lg:flex"
            >
              <HeartIcon size={19} />
              <Count n={wishlistCount} />
            </Link>

            <button
              onClick={openCart}
              aria-label={count ? `Panier, ${count} article(s)` : "Panier"}
              className="relative flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-champagne-2"
            >
              <CartIcon size={19} />
              <Count n={count} />
            </button>
          </div>
        </div>

        {/* ── The panel ─────────────────────────────────────────────────── */}
        <div className="pointer-events-none relative">
          <AnimatePresence>
            {active && (
              <div className="pointer-events-none absolute inset-x-0 top-0">
                <NavPanel group={active} onNavigate={() => setActiveId(null)} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* A soft veil so the page recedes when a panel is open. */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="veil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            onClick={() => setActiveId(null)}
            aria-hidden
            className="fixed inset-0 z-30 bg-ink/15"
          />
        )}
      </AnimatePresence>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSearch={() => setSearchOpen(true)}
        universes={mobileGroups}
        user={user}
      />
      <MobileTabs onSearch={() => setSearchOpen(true)} />
      <SearchSurface open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
