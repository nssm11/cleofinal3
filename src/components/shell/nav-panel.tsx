"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import type { MegaGroup } from "@/lib/navigation";
import { EASE_LUXE, D } from "@/lib/motion";

/**
 * LE PANNEAU — the navigation panel.
 *
 * Not a dropdown: a full-bleed editorial chapter that opens under the rail.
 * The left third is the universe itself (image, name, its own sentence); the
 * right two-thirds are its real contents, arranged as newspaper columns so the
 * eye can scan one column without reading the others.
 */
export function NavPanel({ group, onNavigate }: { group: MegaGroup; onNavigate: () => void }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="region"
      aria-label={`Navigation — ${group.label}`}
      initial={reduce ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, transition: { duration: D.instant, ease: "easeOut" } }}
      transition={{ duration: 0.58, ease: EASE_LUXE }}
      className="pointer-events-auto border-b border-stone/70 bg-cream/95 backdrop-blur-2xl"
    >
      <div className="container-wide grid gap-10 py-10 lg:grid-cols-12 lg:gap-14 lg:py-14">
        {/* The chapter */}
        <div className="lg:col-span-3">
          {group.image && (
            <Link href={group.href} onClick={onNavigate} className="group relative block aspect-[4/5] overflow-hidden bg-marble">
              <Image
                src={group.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 24vw"
                className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent"
              />
              <span className="absolute inset-x-4 bottom-4 font-display text-[26px] italic leading-none text-paper">
                {group.label}
              </span>
            </Link>
          )}
          {group.story && (
            <p className="mt-5 hidden max-w-xs text-[13.5px] leading-relaxed text-muted lg:block">{group.story}</p>
          )}
        </div>

        {/* The contents */}
        <div className="lg:col-span-7">
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {group.columns.map((col, ci) => (
              <motion.div
                key={col.heading}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE_LUXE, delay: 0.06 + ci * 0.05 }}
              >
                <p className="mb-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.28em] text-champagne-2">
                  <span className="inline-block h-px w-3 bg-champagne-2/50" aria-hidden />
                  {col.heading}
                </p>
                <ul>
                  {col.items.map((it) => (
                    <li key={`${col.heading}-${it.slug}`}>
                      <Link
                        href={it.href}
                        onClick={onNavigate}
                        className="group flex items-baseline gap-2 py-2 text-[14px] leading-snug text-charcoal transition-colors duration-300 hover:text-ink"
                      >
                        <span className="relative">
                          {it.name}
                          <span
                            aria-hidden
                            className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-champagne transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
                          />
                        </span>
                        <ArrowRightIcon
                          size={10}
                          className="shrink-0 translate-x-0 text-champagne opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The invitation */}
        <div className="flex flex-col justify-between border-t border-stone/70 pt-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div>
            <p className="eyebrow text-muted-2">La maison</p>
            <ul className="mt-4 space-y-1">
              {[
                ["/promotions", "Offres du moment"],
                ["/marques", "Les laboratoires"],
                ["/journal", "Le Journal"],
                ["/boutiques", "Nos boutiques"],
                ["/besoin/peau-sensible", "Trouver mon soin"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="block py-1 text-[13px] text-muted transition-colors duration-300 hover:text-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {group.callout && (
            <Link href={group.callout.href} onClick={onNavigate} className="btn-ghost mt-8 self-start">
              {group.callout.label} <ArrowRightIcon size={13} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
