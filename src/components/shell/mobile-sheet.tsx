"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, ChevronDownIcon, CloseIcon, LogoutIcon, SearchIcon } from "@/components/icons";
import { logoutAction } from "@/actions/auth";
import { Wordmark } from "./announcement-strip";
import type { NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";
import { EASE_LUXE, D, leave, sheetUp } from "@/lib/motion";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * LE RIDEAU — the mobile menu.
 *
 * A bottom sheet, not a side drawer: it keeps the name of the house visible at
 * the top of the screen and puts the seven rayons where the thumb already is.
 * Each rayon opens in place, as an accordion of its real categories.
 */
export function MobileSheet({
  open,
  onClose,
  onSearch,
  universes,
  user,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  universes: NavUniverse[];
  user: SafeUser | null;
}) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="scrim"
            aria-label="Fermer le menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: D.fast, ease: EASE_LUXE }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="sheet"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            variants={sheetUp}
            initial={reduce ? false : "initial"}
            animate="animate"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[90dvh] flex-col overflow-hidden border-t border-stone-2/30 bg-paper lg:hidden"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="marble-veil opacity-40" />
            </div>

            <div className="relative flex items-center justify-between border-b border-stone/60 px-4 py-3">
              <Wordmark size="sm" />
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
              <button
                onClick={() => {
                  onClose();
                  onSearch();
                }}
                className="flex h-12 w-full items-center gap-3 border border-stone-2/40 bg-cream/60 px-4 text-left text-[13.5px] text-muted"
              >
                <SearchIcon size={16} /> Rechercher un produit, une marque…
              </button>

              <ul className="mt-5">
                {universes.map((u, i) => {
                  const isOpen = expanded === u.slug;
                  return (
                    <li key={u.id} className="border-b border-stone/60">
                      <div className="flex items-stretch">
                        <Link
                          href={`/univers/${u.slug}`}
                          onClick={onClose}
                          className="flex flex-1 items-center gap-4 py-3.5"
                        >
                          <span className="font-display text-xs italic text-champagne-2">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex items-center gap-3">
                            {u.image && (
                              <span className="relative h-9 w-9 shrink-0 overflow-hidden bg-marble">
                                <Image src={u.image} alt="" fill sizes="36px" className="object-cover" />
                              </span>
                            )}
                            <span className="font-display text-[19px] text-ink">{u.name}</span>
                          </span>
                        </Link>
                        {u.children.length > 0 && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : u.slug)}
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Réduire" : "Déployer"} ${u.name}`}
                            className="flex w-12 items-center justify-center text-muted-2"
                          >
                            <ChevronDownIcon
                              size={16}
                              className={`transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0, transition: leave }}
                            transition={{ duration: 0.45, ease: EASE_LUXE }}
                            className="overflow-hidden"
                          >
                            <div className="pb-3 pl-8">
                              {u.children.map((c) => (
                                <li key={c.id}>
                                  <Link
                                    href={`/categorie/${c.slug}`}
                                    onClick={onClose}
                                    className="flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-ink"
                                  >
                                    {c.name}
                                  </Link>
                                </li>
                              ))}
                              <li>
                                <Link
                                  href={`/univers/${u.slug}`}
                                  onClick={onClose}
                                  className="mt-1 inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-champagne-2"
                                >
                                  Tout l&apos;univers {u.name} <ArrowRightIcon size={12} />
                                </Link>
                              </li>
                            </div>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ["/promotions", "Offres du moment"],
                  ["/marques", "Les laboratoires"],
                  ["/journal", "Le Journal"],
                  ["/boutiques", "Nos boutiques"],
                  ["/besoin/peau-sensible", "Trouver mon soin"],
                  ["/suivi", "Suivre ma commande"],
                  ["/aide", "Aide & FAQ"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex min-h-11 items-center text-[13.5px] text-charcoal"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="mt-7 border-t border-stone/60 pt-5">
                {user ? (
                  <form action={logoutAction}>
                    <button className="flex min-h-11 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-muted">
                      <LogoutIcon size={15} /> Déconnexion — {user.firstName}
                    </button>
                  </form>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/connexion" onClick={onClose} className="btn-secondary flex-1">
                      Connexion
                    </Link>
                    <Link href="/inscription" onClick={onClose} className="btn-primary flex-1">
                      Créer un compte
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
