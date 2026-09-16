"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRightIcon } from "@/components/icons";
import { ProductImage } from "@/components/catalog/product-image";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { EASE_LUXE } from "@/lib/motion";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

export type ConcernEntry = {
  slug: string;
  name: string;
  n: number;
  /** The plate that speaks for this concern while the hand hesitates. */
  image: string | null;
  productName: string | null;
};

/**
 * PAR BESOIN — the ritual is found by naming what the skin asks for.
 *
 * Not six identical cards: a single column of great words, each one a door.
 * The hand hovers, a plate answers on the left; the word is chosen, and the
 * whole shelf behind it filters itself. The list IS the selector.
 */
export function ConcernExplorer({ concerns }: { concerns: ConcernEntry[] }) {
  const ed = VISAGE_EDITION.concerns;
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(concerns[0]?.slug ?? "");
  const active = concerns.find((c) => c.slug === hovered) ?? concerns[0];

  return (
    <section id="besoins" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <div className="container-wide grid gap-14 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        {/* The left hand — the invitation, and the plate that answers. */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal amount={0.1}>
              <p className={`${NOIR_EYEBROW} mb-7 flex items-center gap-4`}>
                <span aria-hidden className="h-px w-10 bg-cine-gold/60" />
                {ed.kicker}
              </p>
              <h2 className="font-display font-light leading-[1.02] tracking-[-0.02em] text-cine-ivory">
                <MaskLine className="text-[clamp(2.2rem,4.4vw,3.6rem)]">{ed.lines[0]}</MaskLine>
                <MaskLine delay={0.08} className="text-[clamp(2.2rem,4.4vw,3.6rem)] italic text-cine-gold">
                  {ed.lines[1]}
                </MaskLine>
              </h2>
              <p className="mt-6 max-w-xs text-[13.5px] leading-[1.85] text-cine-mist">{ed.hint}</p>
            </Reveal>

            {/* The answering plate — desktop only, a quiet crossfade. */}
            {active && (
              <div className="relative mt-10 hidden h-[300px] w-[240px] lg:block" aria-hidden>
                <AnimatePresence mode="sync">
                  <motion.div
                    key={active.slug}
                    initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, ease: EASE_LUXE }}
                    className="absolute inset-0 overflow-hidden bg-marble"
                  >
                    {active.image && (
                      <ProductImage src={active.image} alt="" sizes="240px" className="object-cover" />
                    )}
                    {active.productName && (
                      <p className="absolute inset-x-0 bottom-0 truncate bg-cine-noir/60 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-cine-mist backdrop-blur-sm">
                        {active.productName}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* The right hand — the great words. */}
        <div className="lg:col-span-8">
          <ul>
            {concerns.map((c, i) => (
              <Reveal key={c.slug} as="li" y={12} delay={i * 0.05} amount={0.1}>
                <Link
                  href={`?concerns=${encodeURIComponent(c.slug)}#rayon`}
                  onMouseEnter={() => setHovered(c.slug)}
                  onFocus={() => setHovered(c.slug)}
                  className="group relative flex items-baseline gap-5 border-t border-cine-line py-6 last:border-b lg:gap-8 lg:py-8"
                >
                  <span className="w-7 shrink-0 font-display text-[13px] italic text-cine-gold/60 transition-colors duration-500 group-hover:text-cine-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 font-display font-light leading-none tracking-[-0.015em] text-cine-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-cine-gold lg:group-hover:translate-x-3">
                    <span className="block truncate text-[clamp(1.9rem,4.6vw,3.4rem)]">{c.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="hidden text-[10.5px] font-medium uppercase tracking-[0.2em] text-cine-faint transition-colors duration-500 group-hover:text-cine-mist sm:block">
                      {c.n} {ed.care}
                    </span>
                    <span
                      aria-hidden
                      className="flex h-10 w-10 items-center justify-center border border-cine-line text-cine-faint transition-all duration-500 group-hover:border-cine-gold/70 group-hover:text-cine-gold"
                    >
                      <ArrowUpRightIcon
                        size={14}
                        className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
