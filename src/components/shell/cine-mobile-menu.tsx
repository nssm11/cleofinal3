"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BagIcon, CloseIcon, SearchIcon, UserIcon } from "@/components/icons";
import {} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import type { NavUniverse } from "@/lib/navigation";
import type { SafeUser } from "@/lib/auth";

/**
 * The menu, on a phone — the whole page turns to night and the rayons are
 * written large. One gesture at a time: a name, or the bag, or the search.
 */
export function CineMobileMenu({
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

  // Esc closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const primary = universes.filter((u) =>
    ["visage", "cheveux", "corps", "solaire", "bebe-maman"].includes(u.slug),
  );
  const rest = universes.filter((u) => !["visage", "cheveux", "corps", "solaire", "bebe-maman"].includes(u.slug));

  const itemVariants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduce ? 0 : 0.12 + i * 0.05, duration: 0.6, ease: EASE },
    }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: "-2%" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: "0%" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-1.5%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 overflow-y-auto bg-petrol text-chalk"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClickCapture={() => onClose()}
        >
          <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />

          <div className="relative mx-auto flex min-h-full max-w-[112rem] flex-col px-6 pb-10 pt-5">
            <div className="flex items-center justify-between">
              <span className="font-ant text-[13px] font-light tracking-[0.34em]">CLÉOPÂTRE</span>
              <button
                onClick={onClose}
                aria-label="Fermer le menu"
                className="flex h-11 w-11 items-center justify-center text-chalk-muted transition-colors hover:text-chalk"
              >
                <CloseIcon size={20} strokeWidth={1.4} />
              </button>
            </div>

            <nav aria-label="Rayons" className="mt-12 flex-1">
              <ul className="space-y-1.5">
                {primary.map((u, i) => (
                  <motion.li
                    key={u.slug}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    className="overflow-hidden"
                  >
                    <Link
                      href={`/univers/${u.slug}`}
                      className="font-ant text-[clamp(2rem,8.5vw,3rem)] font-light leading-[1.12] tracking-[-0.01em] text-chalk transition-colors hover:text-iodine"
                    >
                      {u.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {rest.length > 0 && (
                <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
                  {rest.map((u, i) => (
                    <motion.li key={u.slug} custom={i + 5} variants={itemVariants} initial="hidden" animate="show">
                      <Link
                        href={`/univers/${u.slug}`}
                        className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-chalk-faint transition-colors hover:text-chalk"
                      >
                        {u.name}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}

              <motion.ul
                variants={itemVariants}
                custom={8}
                initial="hidden"
                animate="show"
                className="mt-12 space-y-4 border-t border-night-line pt-8"
              >
                <li>
                  <Link href="/boutique" className="btn-night text-[11px]!">
                    Toute la boutique
                  </Link>
                </li>
                <li className="flex flex-wrap gap-x-7 gap-y-2 text-[12px] text-chalk-faint">
                  <Link href="/marques" className="transition-colors hover:text-chalk">
                    Les maisons
                  </Link>
                  <Link href="/journal" className="transition-colors hover:text-chalk">
                    Le journal
                  </Link>
                  <Link href="/promotions" className="transition-colors hover:text-chalk">
                    Promotions
                  </Link>
                  <Link href="/aide" className="transition-colors hover:text-chalk">
                    Aide
                  </Link>
                </li>
              </motion.ul>
            </nav>

            <motion.div
              variants={itemVariants}
              custom={9}
              initial="hidden"
              animate="show"
              className="mt-12 flex items-center gap-1 border-t border-night-line pt-6"
            >
              <button
                onClick={onSearch}
                aria-label="Rechercher"
                className="flex h-12 w-14 items-center justify-center text-chalk-muted transition-colors hover:text-chalk"
              >
                <SearchIcon size={19} strokeWidth={1.4} />
              </button>
              <Link
                href={user ? "/compte" : "/connexion?next=/compte"}
                aria-label="Mon compte"
                className="flex h-12 w-14 items-center justify-center text-chalk-muted transition-colors hover:text-chalk"
              >
                <UserIcon size={19} strokeWidth={1.4} />
              </Link>
              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                aria-label="Mon sac"
                className="ml-auto flex h-12 items-center gap-3 px-2 text-[10px] font-bold uppercase tracking-[0.26em] text-chalk"
              >
                <BagIcon size={18} strokeWidth={1.4} aria-hidden />
                Sac
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
