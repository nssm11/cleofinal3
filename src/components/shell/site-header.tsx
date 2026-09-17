"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  BagIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChartIcon,
  ListIcon,
  LogoutIcon,
} from "@/components/icons";
import { Brand } from "@/components/shell/brand";
import { useCart } from "@/components/cart/cart-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchSurface } from "./search-surface";
import { MobileTabs } from "./mobile-tabs";
import { Sheet, Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/kit";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { EASE_LUXE, D } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   L'ENSEIGNE — the sign of the house.
   ──────────────────────────────────────────────────────────────────────────
   One bar, three states:

     · AT REST, over the film — nothing but the name and five words in light.
     · AT REST, on the day — the same, in ink on porcelain, with no band at
       all: the composition starts at the very top of the viewport.
     · SCROLLED — the bar settles onto a blurred sheet (porcelain over the
       day, obsidian over the film) with a hairline underneath and a cinabre
       thread along its base that measures how far into the page you are.

   The rail of universes opens a full panel, not a dropdown: the instrument's
   own index, with the categories each rayon actually holds — read live from
   the catalogue, never hard-coded. Escape closes it, focus keeps it open,
   and the whole thing is keyboard-reachable.
   ══════════════════════════════════════════════════════════════════════════ */

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  // Over the film — the homepage's opening frame and the universe heroes —
  // the bar is light. Everywhere else it is ink on the day. (The private pages
  // have their own strip, `DoorBar`, and never wear this one.)
  const overFilm = pathname === "/" || pathname.startsWith("/univers");
  const dark = overFilm && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setPanel(null);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setPanel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hold = (id: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setPanel(id);
  };
  const release = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPanel(null), 160);
  };

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  /* The panel belongs to the pointer, never to the route: a universe page must
     not arrive with an index hanging over its opening frame. */
  const openGroup = panel ? groups.find((g) => g.id === panel) ?? null : null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40">
        <motion.header
          initial={false}
          animate={{
            backgroundColor: scrolled ? (dark ? "rgba(10,10,12,0.72)" : "rgba(242,241,237,0.82)") : "rgba(0,0,0,0)",
            borderColor: scrolled ? (dark ? "rgba(244,243,240,0.14)" : "rgba(17,17,19,0.10)") : "rgba(0,0,0,0)",
          }}
          transition={{ duration: D.fast, ease: EASE_LUXE }}
          onMouseLeave={release}
          className={cn("relative border-b backdrop-blur-md", !scrolled && "backdrop-blur-none")}
        >
          {/* Over a film the bar needs a floor: a scrim that guarantees the
              words can be read on any frame, however bright the footage. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-[136px] transition-opacity duration-700",
              dark && !scrolled ? "opacity-100" : "opacity-0",
            )}
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(8,8,10,0.78) 0%, rgba(8,8,10,0.42) 46%, rgba(8,8,10,0.12) 78%, transparent 100%)",
            }}
          />
          <div className="container-wide relative flex h-[68px] items-center gap-6">
            {/* The name */}
            <span onMouseEnter={release} className="relative z-10">
              <Brand size="md" light={dark} descriptor={false} />
            </span>

            {/* The rail */}
            <nav
              aria-label="Univers"
              className="scrollbar-none hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex"
            >
              {groups.map((g) => {
                const on = isOn(g.href);
                const open = panel === g.id;
                return (
                  <Link
                    key={g.id}
                    href={g.href}
                    onMouseEnter={() => hold(g.id)}
                    onFocus={() => hold(g.id)}
                    className={cn(
                      "relative whitespace-nowrap px-2.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors xl:px-4 xl:tracking-[0.18em]",
                      dark ? "text-alabaster/80 hover:text-alabaster" : "text-graphite hover:text-ink",
                      (on || open) && (dark ? "text-alabaster" : "text-ink"),
                    )}
                  >
                    {g.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 -bottom-px h-px origin-center bg-cinabre transition-transform duration-500 ease-[var(--ease-luxe)]",
                        on || open ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* The gestures */}
            <div className="relative z-10 ms-auto flex items-center gap-0.5 lg:ms-0">
              <button
                type="button"
                onMouseEnter={release}
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher"
                className={cn(
                  "flex h-10 items-center gap-2 px-3 transition-colors",
                  dark ? "text-alabaster/80 hover:text-alabaster" : "text-graphite hover:text-ink",
                )}
              >
                <SearchIcon size={17} />
                <span className="hidden font-mono text-[0.625rem] uppercase tracking-[0.16em] xl:inline">⌘K</span>
              </button>

              <Link
                href="/compte/favoris"
                onMouseEnter={release}
                aria-label="Favoris"
                className={cn(
                  "relative hidden h-10 w-10 items-center justify-center transition-colors sm:flex",
                  dark ? "text-alabaster/80 hover:text-alabaster" : "text-graphite hover:text-ink",
                )}
              >
                <HeartIcon size={17} />
                {wishlistCount > 0 && (
                  <span className="num absolute -end-0.5 top-1 text-[0.5625rem] text-cinabre-3">{wishlistCount}</span>
                )}
              </Link>

              <div onMouseEnter={release} className="hidden sm:block">
                {user ? (
                  <Menu
                    trigger={
                      <button
                        type="button"
                        aria-label="Mon compte"
                        className={cn(
                          "flex h-10 w-10 items-center justify-center transition-colors",
                          dark ? "text-alabaster/80 hover:text-alabaster" : "text-graphite hover:text-ink",
                        )}
                      >
                        <UserIcon size={17} />
                      </button>
                    }
                  >
                    <MenuLabel>{user.firstName ?? user.email}</MenuLabel>
                    <MenuSeparator />
                    <MenuItem asChild icon={<UserIcon size={14} />}>
                      <Link href="/compte">Mon espace</Link>
                    </MenuItem>
                    <MenuItem asChild icon={<ListIcon size={14} />}>
                      <Link href="/compte/commandes">Mes commandes</Link>
                    </MenuItem>
                    <MenuItem asChild icon={<HeartIcon size={14} />}>
                      <Link href="/compte/favoris">Mes favoris</Link>
                    </MenuItem>
                    {(user.role === "admin" || user.role === "support") && (
                      <>
                        <MenuSeparator />
                        <MenuItem asChild icon={<ChartIcon size={14} />}>
                          <Link href="/admin">L&apos;instrument</Link>
                        </MenuItem>
                      </>
                    )}
                    <MenuSeparator />
                    <form action="/api/auth/logout" method="post">
                      <MenuItem asChild icon={<LogoutIcon size={14} />}>
                        <button type="submit" className="w-full text-start">
                          Se déconnecter
                        </button>
                      </MenuItem>
                    </form>
                  </Menu>
                ) : (
                  <Link
                    href="/connexion"
                    className={cn(
                      "flex h-10 items-center px-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] transition-colors",
                      dark ? "text-alabaster/80 hover:text-alabaster" : "text-graphite hover:text-ink",
                    )}
                  >
                    Connexion
                  </Link>
                )}
              </div>

              <NotificationBell onDark={dark} />

              <button
                type="button"
                onMouseEnter={release}
                onClick={openCart}
                aria-label={`Panier${count ? `, ${count} article(s)` : ""}`}
                className={cn(
                  "relative flex h-10 items-center gap-2 px-3 transition-colors",
                  dark ? "text-alabaster hover:text-cinabre-3" : "text-ink hover:text-cinabre",
                )}
              >
                <BagIcon size={18} />
                <span className="num text-[0.6875rem]">{count > 0 ? count : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir le menu"
                className={cn(
                  "flex h-10 w-10 items-center justify-center transition-colors lg:hidden",
                  dark ? "text-alabaster" : "text-ink",
                )}
              >
                <MenuIcon size={18} />
              </button>
            </div>
          </div>

          {/* The measure — how far into the page you are. */}
          <motion.span
            aria-hidden
            style={{ scaleX: reduce ? 1 : progress, opacity: scrolled ? 1 : 0 }}
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-cinabre"
          />
        </motion.header>

        {/* ── The index — the universe opens as a spread, never as a wall ──── */}
        <AnimatePresence>
          {openGroup && (
            <motion.div
              key={openGroup.id}
              initial={reduce ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={{ duration: D.base, ease: EASE_LUXE }}
              onMouseEnter={() => hold(openGroup.id)}
              onMouseLeave={release}
              className={cn(
                "hidden border-b lg:block",
                dark ? "border-film-line bg-obsidian/94 backdrop-blur-xl" : "border-rule bg-alabaster/96 backdrop-blur-xl",
              )}
            >
              {/* The seam: one hairline of cinabre where the bar ends. */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-cinabre/60" />
              <div className="container-wide grid grid-cols-12 gap-x-12 gap-y-6 py-8">
                <div className="col-span-3">
                  <p className={cn("micro", dark ? "text-cinabre-3" : "text-cinabre")}>{openGroup.label}</p>
                  <p
                    className={cn(
                      "mt-3 font-display text-[1.45rem] leading-[1.14] tracking-[-0.02em]",
                      dark ? "text-alabaster" : "text-ink",
                    )}
                  >
                    {openGroup.description}
                  </p>
                  {openGroup.image && (
                    <div className="relative mt-5 aspect-[4/5] overflow-hidden bg-bone-2">
                      <Image src={openGroup.image} alt="" fill sizes="300px" className="object-cover" />
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-cinabre/70" />
                    </div>
                  )}
                </div>

                <motion.div
                  variants={reduce ? undefined : { show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }}
                  initial="hidden"
                  animate="show"
                  className="col-span-9 grid grid-cols-3 gap-x-10 gap-y-8"
                >
                  {openGroup.columns.map((col, ci) => (
                    <motion.div
                      key={col.heading}
                      variants={reduce ? undefined : { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_LUXE } } }}
                    >
                      <p
                        className={cn(
                          "flex items-baseline gap-2.5 border-b pb-3",
                          dark ? "border-film-line" : "border-rule",
                        )}
                      >
                        <span className="num text-[0.5625rem] text-cinabre">{String(ci + 1).padStart(2, "0")}</span>
                        <span className={cn("micro", dark ? "text-alabaster/50" : "text-ash")}>{col.heading}</span>
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {col.items.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={item.href}
                              className={cn(
                                "group relative inline-flex items-baseline gap-2 text-[0.875rem] transition-all duration-300 hover:translate-x-1",
                                dark ? "text-alabaster/75 hover:text-alabaster" : "text-slate hover:text-cinabre",
                              )}
                            >
                              <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-current">
                                {item.name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>

                {openGroup.callout && (
                  <Link
                    href={openGroup.callout.href}
                    className={cn(
                      "col-span-12 flex items-center justify-between border-t pt-4 font-mono text-[0.625rem] uppercase tracking-[0.18em] transition-colors",
                      dark
                        ? "border-film-line text-alabaster/70 hover:text-alabaster"
                        : "border-rule text-graphite hover:text-cinabre",
                    )}
                  >
                    {openGroup.callout.label}
                    <ArrowRightIcon size={13} className="rtl-mirror" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── The mobile menu ──────────────────────────────────────────────── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} side="right" title="La maison" description="Les rayons, le compte, le service.">
        <nav aria-label="Navigation" className="px-5 py-6">
          <ul className="space-y-1">
            {mobileGroups.map((u) => (
              <li key={u.id} className="border-b border-rule py-1">
                <Link href={`/univers/${u.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-3.5">
                  <span className="font-display text-[1.35rem] text-ink">{u.name}</span>
                  <ArrowRightIcon size={15} className="text-ash rtl:rotate-180" />
                </Link>
                {u.children.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-2 pb-4">
                    {u.children.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/categorie/${c.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-graphite"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { href: "/boutique", label: "La boutique" },
              { href: "/marques", label: "Les laboratoires" },
              { href: "/besoin/peau-sensible", label: "Par besoin" },
              { href: "/promotions", label: "Offres du moment" },
              { href: "/journal", label: "Le Journal" },
              { href: "/diagnostic", label: "Diagnostic" },
              { href: "/boutiques", label: "Nos boutiques" },
              { href: "/aide", label: "Aide & FAQ" },
              { href: "/suivi", label: "Suivre ma commande" },
              { href: "/carte-cadeau", label: "Carte cadeau" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-cinabre"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-rule pt-6">
            {user ? (
              <>
                <Link href="/compte" onClick={() => setMenuOpen(false)} className="btn-line w-full">
                  Mon espace
                </Link>
                {(user.role === "admin" || user.role === "support") && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn-quiet w-full justify-center">
                    L&apos;instrument
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/connexion" onClick={() => setMenuOpen(false)} className="btn-solid w-full">
                  Connexion
                </Link>
                <Link href="/inscription" onClick={() => setMenuOpen(false)} className="btn-quiet w-full justify-center">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </nav>
      </Sheet>

      <SearchSurface open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileTabs onSearch={() => setSearchOpen(true)} />
    </>
  );
}
