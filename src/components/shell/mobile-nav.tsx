"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/icons";
import { EASE } from "@/components/kit/motion";
import type { NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE SOMMAIRE — the phone's table of contents.

   The screen becomes a page of the ledger: the five rayons set as poster
   lines, numbered; the rest of the house as a ruled index; the counter's two
   addresses at the foot. Every line is a full-width row with a hairline, so
   the thumb has nothing to aim at but a large, honest target.
   ══════════════════════════════════════════════════════════════════════════ */

const SECONDARY: [string, string][] = [
  ["/boutique", "Toute la boutique"],
  ["/marques", "Les laboratoires"],
  ["/promotions", "Promotions"],
  ["/journal", "Le journal"],
  ["/diagnostic", "Diagnostic peau"],
  ["/boutiques", "Nos comptoirs"],
  ["/aide", "Aide & contact"],
];

export function MobileNav({
  open,
  onClose,
  onSearch,
  universes,
  user,
  onOpenCart,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  universes: NavUniverse[];
  user: SafeUser | null;
  onOpenCart: () => void;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const primary = universes.filter((u) =>
    ["visage", "cheveux", "corps", "solaire", "bebe-maman"].includes(u.slug),
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
          exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.44, ease: EASE }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-canvas lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sommaire"
        >
          <div className="flex min-h-full flex-col">
            <div className="rule-b flex items-center justify-between px-4 py-3.5">
              <span className="flex items-center gap-2">
                <span aria-hidden className="notch-sm block h-3 w-3 bg-iodine" />
                <span className="font-ant text-[0.95rem] uppercase tracking-[0.14em]">Cléopâtre</span>
              </span>
              <button
                onClick={onClose}
                aria-label="Fermer le sommaire"
                className="-me-2 flex h-11 w-11 items-center justify-center"
              >
                <span className="relative block h-4 w-4">
                  <span className="absolute top-1/2 block h-px w-4 rotate-45 bg-current" />
                  <span className="absolute top-1/2 block h-px w-4 -rotate-45 bg-current" />
                </span>
              </button>
            </div>

            <nav aria-label="Rayons" className="flex-1">
              <ul>
                {primary.map((u, i) => {
                  const on = pathname.startsWith(`/univers/${u.slug}`);
                  return (
                    <motion.li
                      key={u.slug}
                      initial={reduce ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.44, ease: EASE, delay: 0.08 + i * 0.04 }}
                      className="rule-b"
                    >
                      <Link
                        href={`/univers/${u.slug}`}
                        className={cn("flex items-baseline gap-4 px-4 py-4", on ? "text-iodine" : "text-carbon")}
                      >
                        <span className="font-mono text-[0.625rem] tracking-[0.2em] opacity-50">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-ant text-[2rem] uppercase leading-none">{u.name}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <ul className="mt-6 px-4">
                {SECONDARY.map(([href, label], i) => (
                  <motion.li
                    key={href}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.28 + i * 0.03 }}
                  >
                    <Link
                      href={href}
                      className="flex items-center justify-between border-b border-line-soft py-3.5 text-[0.9375rem] text-steel"
                    >
                      {label}
                      <span aria-hidden className="font-mono text-[0.625rem] text-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="rule-t bg-mist px-4 py-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={onSearch}
                  className="flex h-12 flex-1 items-center justify-center gap-2 border border-line bg-porcelain font-mono text-[0.6875rem] uppercase tracking-[0.14em]"
                >
                  <SearchIcon size={15} /> Rechercher
                </button>
                <Link
                  href={user ? "/compte" : "/connexion?next=/compte"}
                  aria-label="Mon compte"
                  className="flex h-12 w-12 items-center justify-center border border-line bg-porcelain"
                >
                  <UserIcon size={17} />
                </Link>
                <Link
                  href={user ? "/compte/favoris" : "/connexion?next=/compte/favoris"}
                  aria-label="Ma liste"
                  className="flex h-12 w-12 items-center justify-center border border-line bg-porcelain"
                >
                  <HeartIcon size={17} />
                </Link>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  aria-label="Mon panier"
                  className="flex h-12 w-12 items-center justify-center bg-carbon text-canvas"
                >
                  <BagIcon size={17} />
                </button>
              </div>
              <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
                Ezzahra · Hammam-Lif — livraison 48 h partout en Tunisie.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
