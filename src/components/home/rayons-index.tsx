"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import { ChapterHead } from "./chapter-head";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * HM - LES SEPT RAYONS - a split-screen scene.
 *
 * The universes are read as an index of oversized names; the photograph of
 * the pointed rayon holds a sticky panel that crossfades and settles with
 * each move. Hover, tap of Tab, touch rail - three ways in, one scene.
 * Nothing below ever shifts: the panel is pinned, only its image changes.
 */

export type Rayon = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  childCount: number;
};

export function RayonsIndex({
  universes,
  copy,
}: {
  universes: Rayon[];
  copy: {
    index: string;
    eyebrow: string;
    title: string;
    description: string;
    action: { href: string; label: string };
    categories: string;
    swipeHint: string;
    enter: string;
  };
}) {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = universes.find((u) => u.id === activeId) ?? universes[0] ?? null;

  return (
    <section aria-label={copy.index} className="relative">
      <div className="container-wide py-20 lg:py-32">
        <ChapterHead
          index={copy.index}
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          action={copy.action}
        />

        {/* Desktop: the split scene */}
        <div className="mt-12 hidden gap-12 lg:mt-16 lg:grid lg:grid-cols-12 xl:gap-16">
          <ul className="lg:col-span-5">
            {universes.map((u, i) => {
              const on = active?.id === u.id;
              return (
                <Reveal as="li" key={u.id} y={12} delay={Math.min(i * 0.04, 0.2)} className="border-b border-stone/60 first:border-t">
                  <Link
                    href={`/univers/${u.slug}`}
                    onMouseEnter={() => setActiveId(u.id)}
                    onFocus={() => setActiveId(u.id)}
                    aria-current={on ? "true" : undefined}
                    className="group flex items-baseline gap-5 py-4 xl:gap-7 xl:py-5"
                  >
                    <span className={`w-8 shrink-0 font-display text-[14px] italic transition-colors duration-300 ${on ? "text-champagne-2" : "text-muted-2"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`hm-index block truncate text-[clamp(1.9rem,3.4vw,3.1rem)] transition-all duration-500 ${
                          on ? "translate-x-3 text-champagne-2 rtl:-translate-x-3" : "text-ink"
                        }`}
                      >
                        {u.name}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
                        {u.childCount} {copy.categories}
                      </span>
                    </span>
                    <ArrowRightIcon
                      size={20}
                      className={`shrink-0 self-center transition-all duration-500 rtl-mirror ${
                        on ? "translate-x-1 text-champagne-2 opacity-100" : "text-sand-2 opacity-40"
                      }`}
                    />
                  </Link>
                </Reveal>
              );
            })}
          </ul>

          {/* The pinned plate: crossfading scene, stable frame */}
          <div className="lg:col-span-7">
            <div className="sticky top-28">
              <Reveal y={20}>
                <div className="plate relative aspect-[16/13] w-full overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    {active?.image && (
                      <motion.div
                        key={active.id}
                        data-reveal=""
                        initial={reduce ? false : { opacity: 0, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        transition={{ duration: reduce ? 0 : D.slow, ease: EASE_LUXE }}
                        className="absolute inset-0"
                      >
                        <Image src={active.image} alt="" fill sizes="(max-width: 1280px) 55vw, 44rem" className="object-cover" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/62 via-ink/6 to-transparent" />
                  {active && (
                    <div key={`cap-${active.id}`} className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 xl:p-8">
                      <div className="min-w-0">
                        <p className="font-display text-[13px] italic text-paper/65">
                          {active.childCount} {copy.categories}
                        </p>
                        <p className="hm-display mt-1 truncate text-[clamp(1.6rem,2.6vw,2.4rem)] text-paper">
                          {active.name}
                        </p>
                        {active.description && (
                          <p className="mt-2 line-clamp-2 max-w-[44ch] text-[13.5px] leading-relaxed text-paper/75">
                            {active.description}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/univers/${active.slug}`}
                        className="group hidden shrink-0 items-center gap-2.5 border border-paper/40 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-paper backdrop-blur-md transition-all duration-500 hover:border-champagne-3 hover:text-champagne-3 sm:inline-flex"
                      >
                        {copy.enter}
                        <ArrowRightIcon size={13} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Touch: the rail */}
        <div className="mt-10 lg:hidden">
          <ul className="scrollbar-none hm-fade-x -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
            {universes.map((u, i) => (
              <li key={u.id} className="w-[70vw] max-w-[320px] shrink-0 snap-start">
                <Link href={`/univers/${u.slug}`} className="group block">
                  <div className="plate relative aspect-[4/5] w-full">
                    {u.image && (
                      <Image
                        src={u.image}
                        alt=""
                        fill
                        sizes="70vw"
                        className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-[1.04]"
                      />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/68 via-ink/6 to-transparent" />
                    <span className="absolute inset-x-4 bottom-4">
                      <span className="block font-display text-[12px] italic text-paper/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block font-display text-[26px] leading-none text-paper">{u.name}</span>
                      <span className="mt-2 block text-[9.5px] font-bold uppercase tracking-[0.2em] text-paper/60">
                        {u.childCount} {copy.categories}
                      </span>
                    </span>
                  </div>
                  {u.description && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{u.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-2">{copy.swipeHint}</p>
        </div>
      </div>
    </section>
  );
}
