"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";

/**
 * The rail of a private room: numbered, hairline-ruled, and marked by a
 * champagne hairline that travels — never by filling a row with ink.
 * The nine chapters (orders, favorites, rituals, cercle, abonnement, support,
 * returns, profile) come from the house dictionary, in the visitor's tongue.
 */
export function AccountNav() {
  const p = usePathname();
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const n = copy.account.nav;
  const items = [
    { href: "/compte", l: n.overview[1], d: n.overview[2], n: n.overview[0] },
    { href: "/compte/commandes", l: n.orders[1], d: n.orders[2], n: n.orders[0] },
    { href: "/compte/favoris", l: n.favorites[1], d: n.favorites[2], n: n.favorites[0] },
    { href: "/compte/rituels", l: n.rituals[1], d: n.rituals[2], n: n.rituals[0] },
    { href: "/compte/fidelite", l: n.fidelite[1], d: n.fidelite[2], n: n.fidelite[0] },
    { href: "/compte/abonnement", l: n.abonnement[1], d: n.abonnement[2], n: n.abonnement[0] },
    { href: "/compte/support", l: n.support[1], d: n.support[2], n: n.support[0] },
    { href: "/compte/retours", l: n.returns[1], d: n.returns[2], n: n.returns[0] },
    { href: "/compte/profil", l: n.profil[1], d: n.profil[2], n: n.profil[0] },
  ] as const;

  return (
    <nav aria-label={copy.account.summary} className="lab-account-nav lg:col-span-3">
      <p className="rule-label mb-6 hidden lg:block">{copy.account.summary}</p>

      <ul className="scrollbar-none -mx-5 flex gap-6 overflow-x-auto px-5 pb-3 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-stone/70 lg:px-0 lg:pb-0">
        {items.map((it) => {
          const active = it.href === "/compte" ? p === it.href : p.startsWith(it.href);
          return (
            <li key={it.href} className="relative shrink-0 lg:shrink">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="group relative flex min-h-11 flex-col justify-center gap-1 py-1 lg:min-h-[4.4rem] lg:block lg:border-b lg:border-stone/70 lg:py-3.5"
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
                      "whitespace-nowrap text-[14px] transition-colors duration-500 lg:whitespace-normal",
                      active ? "text-ink" : "text-charcoal group-hover:text-ink",
                    )}
                  >
                    {it.l}
                  </span>
                </span>
                <span className="hidden max-w-[15rem] text-[11.5px] leading-snug text-muted-2 lg:mt-1 lg:block">{it.d}</span>

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

      <div className="mt-8 hidden lg:block">
        <p className="eyebrow mb-3 text-champagne-2">{copy.account.question}</p>
        <p className="text-[12.5px] leading-relaxed text-muted">{copy.account.questionText}</p>
        <a href="tel:+21671450210" className="link-underline mt-4 inline-flex font-display text-[19px] text-ink">
          71 450 210
        </a>
      </div>
    </nav>
  );
}
