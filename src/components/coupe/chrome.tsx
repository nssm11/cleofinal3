"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { CartIcon, CloseIcon, HeartIcon, SearchIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { AccountPanel } from "@/components/shell/account-panel";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { SearchSurface } from "@/components/shell/search-surface";
import { fmt } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { D, EASE_LUXE, sheetUp } from "@/lib/motion";

/**
 * LE CHROME DE LA COUPE — the homepage's own navigation body.
 *
 * On every other page the house wears its usual sign (SiteHeader). On the
 * section-drawing homepage the relationship is rebuilt around three ideas:
 *
 *   1 · THE PLAQUE — a thin engraved bar, not a floating pill. At the façade
 *       it is barely there; once you descend registers it collects a floor
 *       read-out (« Vous êtes à : l'ordonnance ») that changes as you move.
 *   2 · THE WAYFINDER — a brass rail down the right margin, one tick per
 *       register. It only exists after you leave the façade, ticks track the
 *       section you are inside, and clicking one walks you to its floor.
 *   3 · THE LEVEL DIAL (mobile) — a bottom bar with three moves: open the
 *       index (floors + arcades + house links, full screen), open search,
 *       open the tray. The desktop mega-navigation's job is done here by the
 *       index sheet, which is the house's own drawing of it.
 *
 * Search, account, locale, cart keep their real implementations — this file
 * only re-hangs them on a different wall.
 */

export const COUPE_FLOORS = [
  "entree",
  "comptoir",
  "etages",
  "vitrine",
  "arrivages",
  "ordonnance",
  "arcades",
  "journal",
  "enseigne",
] as const;

type FloorKey = (typeof COUPE_FLOORS)[number];

function Count({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center px-1 text-[8.5px] font-extrabold tabular-nums transition-opacity",
        n > 0 ? "bg-brass text-plaster opacity-100" : "opacity-0",
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function RegistreChrome({
  universes,
  user,
  wishlistCount,
}: {
  universes: { slug: string; name: string; children: { name: string; slug: string }[] }[];
  user: SafeUser | null;
  wishlistCount: number;
}) {
  const { copy } = useLocale();
  const c = copy.coupe;
  const reduce = useReducedMotion();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [floor, setFloor] = useState<FloorKey>("entree");
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [hovered, setHovered] = useState<FloorKey | null>(null);
  const ticking = useRef(0);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.5 });
  const scaleX = useTransform(progress, [0, 1], [0, 1]);

  // The floor read-out: the last register whose top crossed 40 % of the viewport.
  const measure = useCallback(() => {
    const line = window.innerHeight * 0.4;
    let current: FloorKey = "entree";
    for (const key of COUPE_FLOORS) {
      const el = document.getElementById(`planche-${key}`);
      if (el && el.getBoundingClientRect().top <= line) current = key;
    }
    setFloor((prev) => (prev === current ? prev : current));
    setScrolled(window.scrollY > 28);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = requestAnimationFrame(() => {
        ticking.current = 0;
        measure();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(id);
      if (ticking.current) cancelAnimationFrame(ticking.current);
    };
  }, [measure]);

  // The façade and the index ask for search; the search surface listens here.
  useEffect(() => {
    const onAsk = () => setSearchOpen(true);
    window.addEventListener("coupe:search", onAsk);
    return () => window.removeEventListener("coupe:search", onAsk);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIndexOpen(false);
        setHovered(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The index sheet holds the page still, like a drawn curtain.
  useEffect(() => {
    document.documentElement.style.overflow = indexOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [indexOpen]);

  const goto = (key: FloorKey) => {
    setIndexOpen(false);
    const el = document.getElementById(`planche-${key}`);
    if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:z-[100] focus:bg-plaster focus:px-4 focus:py-2 focus:text-[12px] focus:text-ink focus:shadow-soft ltr:focus:left-3 rtl:focus:right-3"
      >
        {copy.meta.skipToContent}
      </a>

      {/* ── THE PLAQUE — the thin engraved bar ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <motion.div
          initial={false}
          animate={{ backgroundColor: scrolled ? "rgba(244,237,221,0.92)" : "rgba(244,237,221,0)" }}
          transition={{ duration: D.base, ease: EASE_LUXE }}
          className="pointer-events-auto border-b backdrop-blur-md transition-[border-color] duration-500"
          style={{ borderColor: scrolled ? "rgba(195,183,156,0.55)" : "rgba(195,183,156,0)" }}
        >
          <div className={cn("mx-auto flex w-full max-w-none items-center gap-4 px-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:px-10", scrolled ? "h-12" : "h-14 lg:h-16")}>
            <Link href="/" className="flex shrink-0 items-baseline gap-2.5" aria-label="Cléopâtre">
              <span className={cn("font-display font-light leading-none uppercase tracking-[0.05em] text-ink transition-all duration-500", scrolled ? "text-[15px] lg:text-[17px]" : "text-[17px] lg:text-[19px]")}>
                Cléopâtre
              </span>
              <span className="hidden text-[7.5px] font-extrabold uppercase tracking-[0.32em] text-muted-2 lg:inline">{c.chrome.maison}</span>
            </Link>

            {/* The floor read-out — the plaque's new job. */}
            <AnimatePresence initial={false} mode="wait">
              {scrolled ? (
                <motion.p
                  key={floor}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.34, ease: EASE_LUXE }}
                  className="hidden items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.28em] text-charcoal-2 lg:flex"
                >
                  <span aria-hidden className="h-px w-5 bg-brass/70" />
                  {c.chrome.here} <span className="text-brass">{c.floors[floor]}</span>
                </motion.p>
              ) : null}
            </AnimatePresence>

            <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={c.chrome.search}
                className="flex h-10 items-center gap-2.5 px-2.5 text-ink transition-colors hover:text-brass lg:px-3"
              >
                <SearchIcon size={17} />
                <span className="hidden text-[9.5px] font-extrabold uppercase tracking-[0.24em] lg:inline">{c.chrome.search}</span>
              </button>
              <span className="hidden lg:block">
                <AccountPanel user={user} />
              </span>
              <Link
                href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"}
                aria-label={wishlistCount ? fmt(copy.header.favoritesCount, { n: wishlistCount }) : copy.header.favorites}
                className="relative hidden h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brass lg:flex"
              >
                <HeartIcon size={17} />
                <Count n={wishlistCount} />
              </Link>
              <button
                type="button"
                onClick={cart.open}
                aria-label={cart.count ? fmt(copy.header.cartCount, { n: cart.count }) : copy.header.cart}
                className="relative flex h-10 items-center gap-2 px-2 text-ink transition-colors hover:text-brass"
              >
                <CartIcon size={17} />
                <span className="hidden text-[9.5px] font-extrabold uppercase tracking-[0.24em] lg:inline">{copy.header.cart}</span>
                <Count n={cart.count} />
              </button>
              <span className="ml-1 hidden lg:block">
                <LocaleSwitcher size="sm" />
              </span>
            </div>
          </div>
          {/* Reading progress — one brass hairline, the house's only meter. */}
          <motion.div aria-hidden style={{ scaleX }} className="h-[2px] origin-left bg-brass/80 ltr:origin-left rtl:origin-right" />
        </motion.div>
      </div>

      {/* ── THE WAYFINDER — brass rail, desktop registers ───────────────── */}
      <motion.nav
        aria-label={c.chrome.floorsTitle}
        initial={false}
        animate={{ opacity: scrolled ? 1 : 0, pointerEvents: scrolled ? "auto" : "none" }}
        transition={{ duration: D.slow, ease: EASE_LUXE }}
        className={cn("fixed top-1/2 z-30 hidden -translate-y-1/2 lg:block", "ltr:right-5 rtl:left-5 xl:right-8")}
      >
        <ul className="flex flex-col items-end gap-2.5 border-t border-stone-2/40 pt-3">
          {COUPE_FLOORS.map((key, i) => {
            const on = floor === key;
            const label = c.floors[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => goto(key)}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(key)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${String(i).padStart(2, "0")} — ${label}`}
                  className="group flex items-center justify-end gap-2.5"
                >
                  <span
                    className={cn(
                      "overflow-hidden text-[8.5px] font-extrabold uppercase tracking-[0.26em] transition-all duration-500",
                      hovered === key ? "max-w-[14rem] text-ink opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    {String(i).padStart(2, "0")} · {label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      on ? "w-8 bg-brass" : "w-4 bg-ink/25 group-hover:w-6 group-hover:bg-brass/60",
                    )}
                  />
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
              aria-label={c.chrome.top}
              className="group mt-2 flex items-center justify-end gap-2 text-[8.5px] font-extrabold uppercase tracking-[0.26em] text-muted-2 transition-colors hover:text-brass"
            >
              <span className="transition-transform duration-500 group-hover:-translate-y-0.5">↑</span>
              <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">{c.chrome.top}</span>
            </button>
          </li>
        </ul>
      </motion.nav>

      {/* ── THE LEVEL DIAL — mobile ─────────────────────────────────────── */}
      <nav
        aria-label={c.chrome.index}
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <motion.div
          initial={false}
          animate={{ y: searchOpen ? 88 : 0 }}
          transition={{ duration: D.base, ease: EASE_LUXE }}
          className="mx-2.5 flex items-stretch justify-between border border-stone-2/50 bg-plaster/92 backdrop-blur-lg"
          style={{ boxShadow: "0 18px 44px -30px rgba(33,27,18,0.5)" }}
        >
          <button type="button" onClick={() => setIndexOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-ink">
            <span className="font-display text-[15px] leading-none">≡</span>
            {c.chrome.index}
          </button>
          <span aria-hidden className="w-px bg-stone/70" />
          <button type="button" onClick={() => setSearchOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-ink">
            <SearchIcon size={16} />
            {c.chrome.search}
          </button>
          <span aria-hidden className="w-px bg-stone/70" />
          <button type="button" onClick={cart.open} className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-ink">
            <span className="relative">
              <CartIcon size={16} />
              <Count n={cart.count} />
            </span>
            {copy.header.cart}
          </button>
        </motion.div>
      </nav>

      {/* ── THE INDEX — full-screen sheet of everything ───────────────── */}
      <AnimatePresence>
        {indexOpen && (
          <motion.div
            key="index"
            role="dialog"
            aria-modal="true"
            aria-label={c.chrome.index}
            {...sheetUp}
            className="fixed inset-0 z-50 overflow-y-auto bg-plaster"
          >
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 pb-28 pt-4">
              <div className="flex items-center justify-between border-b border-stone pb-3">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-muted-2">{c.chrome.index}</p>
                <button type="button" onClick={() => setIndexOpen(false)} aria-label={copy.common.close} className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-brass">
                  <CloseIcon size={20} />
                </button>
              </div>

              <section className="mt-6">
                <p className="rule-label mb-3">{c.chrome.floorsTitle}</p>
                <ol className="border-t border-stone">
                  {COUPE_FLOORS.map((key, i) => (
                    <li key={key} className="border-b border-stone">
                      <button
                        type="button"
                        onClick={() => goto(key)}
                        className="flex w-full items-baseline gap-5 py-3 text-left"
                      >
                        <span className="font-display text-[13px] italic text-brass">{String(i).padStart(2, "0")}</span>
                        <span className="font-display text-[clamp(1.4rem,7vw,1.9rem)] uppercase tracking-[0.02em] text-ink">{c.floors[key]}</span>
                        <span aria-hidden className="ml-auto text-ink/40">↓</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-8">
                <p className="rule-label mb-3">{c.chrome.arcadesTitle}</p>
                <ul className="columns-2 gap-x-6 border-t border-stone pt-3">
                  {universes.map((u) => (
                    <li key={u.slug} className="mb-1.5 break-inside-avoid">
                      <Link href={`/univers/${u.slug}`} onClick={() => setIndexOpen(false)} className="flex items-baseline justify-between gap-3 border-b border-transparent pb-1.5 font-display text-[16px] text-charcoal transition-colors hover:text-brass">
                        <span>{u.name}</span>
                        <span className="text-[9px] font-extrabold tracking-[0.2em] text-muted-2">{u.children.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8">
                <p className="rule-label mb-3">{c.chrome.houseTitle}</p>
                <ul className="grid gap-x-6 gap-y-1 border-t border-stone pt-3 sm:grid-cols-2">
                  {(
                    [
                      ["/boutique", copy.header.shop],
                      ["/promotions", copy.footer.links.promotions],
                      ["/journal", copy.header.journal],
                      ["/marques", copy.header.brands],
                      ["/diagnostic", copy.header.diagnostic],
                      ["/boutiques", copy.header.stores],
                      ["/suivi", copy.header.tracking],
                      ["/aide", copy.header.help],
                    ] as [string, string][]
                  ).map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} onClick={() => setIndexOpen(false)} className="block py-1.5 text-[12.5px] font-bold uppercase tracking-[0.16em] text-charcoal transition-colors hover:text-brass">
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={user ? "/compte" : "/connexion"} onClick={() => setIndexOpen(false)} className="block py-1.5 text-[12.5px] font-bold uppercase tracking-[0.16em] text-brass">
                      {copy.header.account}
                    </Link>
                  </li>
                </ul>
              </section>

              <div className="mt-9 flex items-center justify-between border-t border-stone pt-5">
                <LocaleSwitcher size="lg" />
                <button type="button" onClick={() => setIndexOpen(false)} className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-muted">
                  {copy.common.close}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchSurface open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
