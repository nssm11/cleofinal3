"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import type { ProductCard as PC } from "@/lib/catalog";
import { ChapterHead } from "./chapter-head";
import { Magnetic } from "./magnetic";
import { AtelierPetit } from "./product-atelier";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * HM - LE PLATEAU - the counter's rotating tray.
 *
 * The selection stops shouting: four compact references at a time in a
 * small sharp grid, and the tray turns endlessly through the rest - never
 * more than a mouthful, never the same mouthful twice. A counter keeps the
 * count honest; the hairline shows the way round. Touch gets the same four
 * in two pairs; stillness gets an instant turn instead of a slide.
 */
const PAGE = 4;

export function Selection({
  items,
  isAuthed = false,
  copy,
}: {
  items: PC[];
  isAuthed?: boolean;
  copy: {
    index: string;
    eyebrow: string;
    title: string;
    action: { href: string; label: string };
    browse: string;
    prev: string;
    following: string;
  };
}) {
  const reduce = useReducedMotion();
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const [[page, dir], setTurn] = useState<[number, number]>([0, 0]);
  if (items.length === 0) return null;

  const turn = (d: 1 | -1) => setTurn(([p]) => [(p + d + pages) % pages, d]);
  const visible = items.slice(page * PAGE, page * PAGE + PAGE);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section aria-label={copy.index} className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(46% 34% at 10% 12%, rgba(203,176,120,0.20), transparent 70%), radial-gradient(44% 30% at 90% 78%, rgba(238,226,201,0.65), transparent 72%)" }}
        />
      </div>

      <div className="relative container-wide py-20 lg:py-28">
        <ChapterHead
          index={copy.index}
          eyebrow={copy.eyebrow}
          title={copy.title}
          action={copy.action}
        />

        {/* The tray: four at a time, never more */}
        <Reveal className="mx-auto mt-12 max-w-6xl lg:mt-16" y={24}>
          <div className="relative">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={page}
                data-reveal=""
                custom={dir}
                initial={reduce ? false : { opacity: 0, x: dir * 56 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: dir * -56 }}
                transition={{ duration: reduce ? 0 : D.base, ease: EASE_LUXE }}
                className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5"
              >
                {visible.map((p) => (
                  <AtelierPetit key={p.id} p={p} isAuthed={isAuthed} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The turn: arrows, count, and the way round */}
          {pages > 1 && (
            <div className="mt-8 flex items-center gap-4 sm:gap-6">
              <button type="button" onClick={() => turn(-1)} aria-label={copy.prev} className="hm-turn shrink-0">
                <ArrowLeftIcon size={17} className="rtl-mirror" />
              </button>
              <p className="shrink-0 text-[12px] font-bold tabular-nums tracking-[0.2em] text-muted" aria-live="polite">
                {pad(page + 1)} <span className="text-sand-2">/ {pad(pages)}</span>
              </p>
              <div className="relative h-px flex-1 bg-stone/70" aria-hidden>
                <motion.span
                  className="absolute inset-y-0 left-0 block bg-champagne-2 rtl:left-auto rtl:right-0"
                  initial={false}
                  animate={{ width: `${((page + 1) / pages) * 100}%` }}
                  transition={{ duration: reduce ? 0 : D.base, ease: EASE_LUXE }}
                />
              </div>
              <button type="button" onClick={() => turn(1)} aria-label={copy.following} className="hm-turn shrink-0">
                <ArrowRightIcon size={17} className="rtl-mirror" />
              </button>
            </div>
          )}
        </Reveal>

        <Reveal className="mt-14 flex justify-center lg:mt-16">
          <Magnetic>
            <Link href="/boutique" className="btn-secondary">
              {copy.browse} <ArrowRightIcon size={13} className="rtl-mirror" />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
