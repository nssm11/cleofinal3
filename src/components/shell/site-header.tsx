"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import type { MegaGroup, NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const SWISS_NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/univers/visage", label: "Visage" },
  { href: "/univers/cheveux", label: "Cheveux" },
  { href: "/univers/corps", label: "Corps" },
  { href: "/univers/solaire", label: "Solaire" },
  { href: "/univers/bebe-maman", label: "Bébé" },
];

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center bg-ink px-1 font-mono text-[10px] font-medium leading-none text-paper">
      {n > 99 ? "99+" : n}
    </span>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── HEADER — 64px, white, hairline, precise ── */}
      <header className="sticky top-0 z-40 flex h-[64px] w-full items-center border-b border-line bg-bg">
        <div className="flex h-full w-full items-center justify-between gap-4 px-4 lg:px-8">
          {/* Left — nav */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center border border-line bg-bg text-ink transition-colors hover:border-ink lg:hidden"
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>

            <nav aria-label="Navigation principale" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {SWISS_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                        isActive(item.href) ? "text-ink" : "text-text-secondary hover:text-ink"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Center — wordmark */}
          <Link
            href="/"
            aria-label="CLÉOPÂTRE — accueil"
            className="absolute left-1/2 -translate-x-1/2 font-sans text-[16px] font-bold tracking-[0.24em] text-ink"
          >
            CLÉOPÂTRE
          </Link>

          {/* Right — actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="flex h-10 w-10 items-center justify-center border border-transparent text-ink transition-colors hover:border-line"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            <Link
              href={user ? "/compte" : "/connexion?next=/compte"}
              aria-label="Mon compte"
              className="hidden h-10 w-10 items-center justify-center border border-transparent text-ink transition-colors hover:border-line sm:flex"
            >
              <User size={16} strokeWidth={1.5} />
            </Link>

            <Link
              href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"}
              aria-label="Favoris"
              className="relative hidden h-10 w-10 items-center justify-center border border-transparent text-ink transition-colors hover:border-line sm:flex"
            >
              <Heart size={16} strokeWidth={1.5} />
              <Count n={wishlistCount} />
            </Link>

            <button
              onClick={openCart}
              aria-label="Panier"
              className="relative flex h-10 w-10 items-center justify-center border border-line bg-bg text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
              <Count n={count} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU — full-screen, typographic ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-bg"
          >
            {/* Top bar */}
            <div className="flex h-[64px] items-center justify-between border-b border-line px-4 lg:px-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">Menu — 01</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                className="flex h-10 w-10 items-center justify-center border border-ink bg-ink text-paper"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Nav */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-12 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <nav aria-label="Menu principal">
                    <ul className="space-y-1">
                      {SWISS_NAV.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="block border-b border-line py-4 font-sans text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[0.9] tracking-[-0.03em] text-ink transition-colors hover:text-text-secondary"
                          >
                            {item.label}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <div className="lg:col-span-4 lg:col-start-9">
                  <div className="space-y-10">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Rayons</p>
                      <ul className="mt-6 space-y-3">
                        {mobileGroups.map((u) => (
                          <li key={u.slug}>
                            <Link
                              href={`/univers/${u.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="font-sans text-[15px] leading-[1.4] text-text-secondary hover:text-ink"
                            >
                              {u.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-line pt-10">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Compte</p>
                      <ul className="mt-6 space-y-3">
                        <li>
                          <Link href={user ? "/compte" : "/connexion"} onClick={() => setMenuOpen(false)} className="font-sans text-[15px] text-ink hover:underline">
                            {user ? "Mon compte" : "Connexion"}
                          </Link>
                        </li>
                        <li>
                          <Link href="/aide" onClick={() => setMenuOpen(false)} className="font-sans text-[15px] text-text-secondary hover:text-ink">
                            Aide
                          </Link>
                        </li>
                        <li>
                          <Link href="/boutiques" onClick={() => setMenuOpen(false)} className="font-sans text-[15px] text-text-secondary hover:text-ink">
                            Boutiques
                          </Link>
                        </li>
                      </ul>
                    </div>

                    <div className="border-t border-line pt-10">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">CLÉOPÂTRE — Système de soin</p>
                      <p className="mt-3 max-w-[28ch] font-sans text-[13px] leading-[1.6] text-text-secondary">
                        Officine dermo-cosmétique. Ezzahra · Hammam-Lif. Livraison partout en Tunisie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-line px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                <span>© {new Date().getFullYear()} CLÉOPÂTRE</span>
                <span>Tunisie — TN</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SEARCH — full-screen, precise ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[80] bg-bg"
          >
            <div className="flex h-[64px] items-center justify-between border-b border-line px-4 lg:px-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">Recherche — ⌘K</span>
              <button
                onClick={() => setSearchOpen(false)}
                className="flex h-10 w-10 items-center justify-center border border-ink bg-ink text-paper"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mx-auto w-full max-w-[960px] px-4 py-12 lg:px-8 lg:py-20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim()) {
                    window.location.href = `/recherche?q=${encodeURIComponent(query.trim())}`;
                  }
                }}
              >
                <div className="border-b border-ink">
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un produit, une marque, un besoin..."
                    className="w-full bg-transparent py-6 font-sans text-[clamp(1.5rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink placeholder:text-text-faint focus:outline-none"
                  />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                    Appuyez sur Entrée pour rechercher
                  </p>
                  <button type="submit" className="btn-primary">
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="mt-16 grid gap-12 lg:grid-cols-2">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Recherches fréquentes</p>
                  <ul className="mt-6 space-y-3">
                    {["La Roche-Posay", "Sérum vitamine C", "Crème hydratante", "Solaire SPF50", "Anti-chute"].map((t) => (
                      <li key={t}>
                        <button
                          onClick={() => {
                            setQuery(t);
                            window.location.href = `/recherche?q=${encodeURIComponent(t)}`;
                          }}
                          className="font-sans text-[15px] text-text-secondary hover:text-ink hover:underline"
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Raccourcis</p>
                  <div className="mt-6 space-y-4 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
                    <div className="flex items-center justify-between border-b border-line py-3">
                      <span>Ouvrir recherche</span>
                      <span className="border border-line px-2 py-1 text-[10px]">⌘ K</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-line py-3">
                      <span>Fermer</span>
                      <span className="border border-line px-2 py-1 text-[10px]">ESC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
