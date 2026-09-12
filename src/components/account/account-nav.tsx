"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const items = [
  { href: "/compte", l: "Vue d'ensemble", d: "Vos dernières commandes et essentiels", n: "01" },
  { href: "/compte/commandes", l: "Mes commandes", d: "Historique, suivi, factures", n: "02" },
  { href: "/compte/diagnostic", l: "Mon diagnostic", d: "Votre conseil beauté et ses raisons", n: "03" },
  { href: "/compte/rituel", l: "Mon rituel", d: "Vos routines, étape par étape", n: "04" },
  { href: "/compte/fidelite", l: "Le Cercle", d: "Vos points, vos paliers, le registre", n: "05" },
  { href: "/compte/favoris", l: "Mes favoris", d: "Votre sélection privée", n: "06" },
  { href: "/compte/retours", l: "Mes retours", d: "Suivi de vos demandes de retour", n: "07" },
  { href: "/compte/profil", l: "Profil & adresses", d: "Informations, sécurité, livraison", n: "08" },
] as const;

/**
 * The rail of a private room: numbered, hairline-ruled, and marked by a
 * champagne hairline that travels — never by filling a row with ink.
 */
export function AccountNav() {
  const p = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Mon espace" className="lg:col-span-3">
      <p className="rule-label mb-6 hidden lg:block">Le sommaire</p>

      <ul className="scrollbar-none -mx-5 flex gap-6 overflow-x-auto px-5 pb-3 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-stone/70 lg:px-0 lg:pb-0">
        {items.map((it) => {
          const active = it.href === "/compte" ? p === it.href : p.startsWith(it.href);
          return (
            <li key={it.href} className="relative shrink-0 lg:shrink">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="group relative flex min-h-11 flex-col justify-center gap-1 py-1 lg:min-h-[4.75rem] lg:block lg:border-b lg:border-stone/70 lg:py-4"
              >
                <span className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      "font-display text-[11px] italic tabular-nums transition-colors duration-500",
                      active ? "text-champagne-2" : "text-muted-2",
                    )}
                  >
                    {it.n}
                  </span>
                  <span
                    className={cn(
                      "text-[14.5px] transition-colors duration-500",
                      active ? "text-ink" : "text-charcoal group-hover:text-ink",
                    )}
                  >
                    {it.l}
                  </span>
                </span>
                <span className="hidden max-w-[15rem] text-[11.5px] leading-snug text-muted-2 lg:mt-1 lg:block">
                  {it.d}
                </span>

                {active && (
                  <motion.span
                    layoutId="account-rail"
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px bg-champagne-2 lg:bottom-[-1px]"
                    transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_LUXE }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 hidden lg:block">
        <p className="eyebrow mb-3 text-champagne-2">Une question ?</p>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Nos pharmaciens répondent du lundi au samedi, de 8 h 30 à 20 h 30.
        </p>
        <a
          href="tel:+21671450210"
          className="link-underline mt-4 inline-flex font-display text-[19px] text-ink"
        >
          71 450 210
        </a>
      </div>
    </nav>
  );
}
