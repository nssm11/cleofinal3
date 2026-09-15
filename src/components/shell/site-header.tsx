"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { SearchSurface } from "./search-surface";
import { MobileTabs } from "./mobile-tabs";
import { CineMobileMenu } from "./cine-mobile-menu";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

/**
 * L'ENSEIGNE — the header of the house, reduced to its essentials.
 *
 * Five words, a name, three gestures. At the top of a page it is invisible —
 * only ink (or light, over the film) on the composition. One scroll and it
 * settles into a band of night: near-black, blurred, one hairline underneath.
 * Nothing else. The old announcement strip, the search pill, the panels —
 * the film does not want them.
 */

const NAV: { href: string; label: string }[] = [
  { href: "/univers/visage", label: "Visage" },
  { href: "/univers/cheveux", label: "Cheveux" },
  { href: "/univers/corps", label: "Corps" },
  { href: "/univers/solaire", label: "Solaire" },
  { href: "/univers/bebe-maman", label: "Bébé" },
];

function Count({ n, light }: { n: number; light: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span
          key={n}
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.8 }}
          aria-hidden
          className={cn(
            "absolute -right-2 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center px-1 text-[9px] font-bold tabular-nums",
            light ? "bg-cine-gold text-cine-noir" : "bg-champagne-2 text-paper",
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
  const { copy } = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Over the film — the homepage's opening frame, the universe heroes and
  // the door (/connexion) — the header is ivory light. Everywhere else, and
  // one scroll past the film, it is ink on the day.
  const overFilm = pathname === "/" || pathname.startsWith("/univers") || pathname === "/connexion";
  const onDark = overFilm && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Browser back/forward closes the menu too; in-app links close it from
  // the sheet's own click capture.
  useEffect(() => {
    const onPop = () => setMenuOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // While the sheet is open, the page may not scroll behind it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const tone = onDark ? "text-cine-ivory" : "text-ink";
  const toneHover = onDark ? "hover:text-cine-gold" : "hover:text-champagne-2";

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow-float focus:rounded-sm ltr:focus:left-4 rtl:focus:right-4"
      >
        {copy.meta.skipToContent}
      </a>

      <div className="fixed inset-x-0 top-0 z-40">
        <motion.header
          initial={false}
          animate={{
            backgroundColor: scrolled ? "rgba(250,247,240,0.88)" : "rgba(250,247,240,0)",
            backdropFilter: scrolled ? "blur(18px)" : "blur(0px)",
            borderColor: scrolled ? "rgba(34,28,19,0.10)" : "rgba(34,28,19,0)",
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "border-b",
            scrolled ? "h-14 lg:h-16" : "h-16 lg:h-20",
          )}
        >
          <div className="mx-auto flex h-full max-w-[112rem] items-center px-4 sm:px-6 lg:px-10">
            {/* Mobile trigger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className={cn(
                "-ml-1 flex h-11 w-11 shrink-0 items-center justify-center transition-colors lg:hidden",
                tone,
                toneHover,
              )}
            >
              <MenuIcon size={19} strokeWidth={1.4} />
            </button>

            {/* The rail — desktop only */}
            <nav aria-label="Rayons" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isOn(item.href) ? "page" : undefined}
                      className={cn(
                        "group relative block py-3 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors duration-300",
                        onDark ? "text-cine-mist hover:text-cine-ivory" : "text-muted hover:text-ink",
                        isOn(item.href) && (onDark ? "text-cine-ivory" : "text-ink"),
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 bottom-1 h-px origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          onDark ? "bg-cine-gold" : "bg-champagne-2",
                          isOn(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
                        )}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* The name — set wide, always centred */}
            <Link
              href="/"
              aria-label="Cléopâtre — accueil"
              className={cn(
                "absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-light tracking-[0.34em] transition-colors duration-300 select-none",
                onDark ? "font-film" : "font-display",
                scrolled ? "text-[13px] sm:text-[14px]" : "text-[15px] sm:text-[16px]",
                onDark ? "text-cine-ivory" : "text-ink",
              )}
            >
              CLÉOPÂTRE
            </Link>

            {/* The gestures */}
            <div className={cn("ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-2", tone)}>
              <button
                onClick={() => setSearchOpen(true)}
                aria-label={copy.header.search}
                className={cn("flex h-11 w-11 items-center justify-center transition-colors", toneHover)}
              >
                <SearchIcon size={18} strokeWidth={1.4} />
              </button>

              <Link
                href={user ? "/compte" : "/connexion?next=/compte"}
                aria-label={copy.header.account ?? "Mon compte"}
                className={cn("relative hidden h-11 w-11 items-center justify-center transition-colors sm:flex", toneHover)}
              >
                <UserIcon size={18} strokeWidth={1.4} />
              </Link>

              <Link
                href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"}
                aria-label={wishlistCount ? fmt(copy.header.favoritesCount, { n: wishlistCount }) : copy.header.favorites}
                className={cn("relative hidden h-11 w-11 items-center justify-center transition-colors sm:flex", toneHover)}
              >
                <HeartIcon size={18} strokeWidth={1.4} />
                <Count n={wishlistCount} light={onDark} />
              </Link>

              <button
                onClick={openCart}
                aria-label={count ? fmt(copy.header.cartCount, { n: count }) : copy.header.cart}
                className={cn("relative flex h-11 w-11 items-center justify-center transition-colors", toneHover)}
              >
                <BagIcon size={18} strokeWidth={1.4} />
                <Count n={count} light={onDark} />
              </button>
            </div>
          </div>
        </motion.header>
      </div>

      <CineMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={() => {
          setMenuOpen(false);
          setSearchOpen(true);
        }}
        universes={mobileGroups}
        user={user}
        onOpenCart={openCart}
      />
      <MobileTabs onSearch={() => setSearchOpen(true)} />
      <SearchSurface open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
