"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, LogoutIcon, UserIcon } from "@/components/icons";
import { logoutAction } from "@/actions/auth";
import type { SafeUser } from "@/lib/auth";
import { EASE_LUXE, D, leave } from "@/lib/motion";

/**
 * LE SALON — the account panel.
 *
 * A customer's space is not a menu of settings; it is a door into their own
 * drawing room. The panel therefore leads with the person's name set in the
 * display face, then lets the destinations follow quietly. Staff accounts get
 * their operational shortcuts pinned above the customer links.
 */
const CUSTOMER_LINKS = [
  { href: "/compte", label: "Mon espace", note: "Vue d'ensemble" },
  { href: "/compte/commandes", label: "Mes commandes", note: "Suivi & factures" },
  { href: "/compte/retours", label: "Mes retours", note: "Demandes en cours" },
  { href: "/compte/diagnostic", label: "Mon diagnostic", note: "Conseil beauté" },
  { href: "/compte/rituel", label: "Mon rituel", note: "Vos routines" },
  { href: "/compte/fidelite", label: "Le Cercle", note: "Points & paliers" },
  { href: "/compte/favoris", label: "Mes favoris", note: "Sélection privée" },
  { href: "/compte/profil", label: "Profil & adresses", note: "Coordonnées" },
];

const STAFF_LINKS = [
  { href: "/admin", label: "Tableau de bord", note: "Pilotage" },
  { href: "/admin/commandes", label: "Commandes", note: "File du jour" },
  { href: "/admin/produits", label: "Produits", note: "Catalogue" },
  { href: "/admin/stock", label: "Stock", note: "Inventaire" },
  { href: "/admin/support", label: "Support", note: "Tickets & retours" },
];

export function AccountPanel({ user }: { user: SafeUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/connexion"
        aria-label="Se connecter"
        className="flex h-11 items-center gap-2.5 px-2 text-ink transition-colors hover:text-champagne-2"
      >
        <UserIcon size={19} />
        <span className="hidden text-[10.5px] font-bold uppercase tracking-[0.19em] xl:inline">Connexion</span>
      </Link>
    );
  }

  const isStaff = user.role === "admin" || user.role === "support";
  const links = isStaff ? STAFF_LINKS : CUSTOMER_LINKS;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Mon compte — ${user.firstName} ${user.lastName}`}
        className="flex h-11 items-center gap-2.5 px-2 text-ink transition-colors hover:text-champagne-2"
      >
        <span className="relative">
          <UserIcon size={19} />
          {isStaff && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-champagne" />
          )}
        </span>
        <span className="hidden text-[10.5px] font-bold uppercase tracking-[0.19em] xl:inline">{user.firstName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? false : { opacity: 0, y: 10, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, y: 6, transition: leave }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="absolute right-0 top-full z-[70] mt-3 w-[19rem] overflow-hidden border border-stone-2/35 bg-cream/97 shadow-float backdrop-blur-2xl"
          >
            <div className="relative border-b border-stone/60 px-5 py-5">
              <span aria-hidden className="marble-veil opacity-40" />
              <p className="eyebrow relative text-muted-2">{isStaff ? "Compte professionnel" : "Votre espace"}</p>
              <p className="relative mt-2 font-display text-[26px] italic leading-none text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="relative mt-2 truncate text-[11px] text-muted">{user.email}</p>
            </div>

            <nav aria-label="Menu du compte" className="py-1.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  role="menuitem"
                  className="group flex items-baseline justify-between gap-3 px-5 py-2.5 transition-colors duration-300 hover:bg-paper"
                >
                  <span className="text-[14px] text-charcoal transition-colors group-hover:text-ink">{l.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-2">{l.note}</span>
                </Link>
              ))}
            </nav>

            {isStaff && (
              <Link
                href="/compte"
                className="flex items-center justify-between border-t border-stone/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
              >
                Espace client <ArrowRightIcon size={12} />
              </Link>
            )}

            <form action={logoutAction} className="border-t border-stone/60">
              <button
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left text-[13px] text-muted transition-colors hover:bg-paper hover:text-error"
              >
                <LogoutIcon size={15} /> Déconnexion
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
