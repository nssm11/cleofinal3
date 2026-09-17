"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { FilmPlate, FilmVeil } from "@/components/media/film-plate";
import { Breadcrumbs } from "@/components/ui/primitives";
import { ArrowDownIcon, ArrowRightIcon } from "@/components/icons";
import { CineQuick } from "./visage-product";
import type { ProductCard as PC } from "@/lib/catalog";
import type { UniverseCinema } from "@/lib/universe-cinema";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_LUXE } },
};
const maskRise = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1.4, ease: EASE_LUXE } },
};

/**
 * VISAGE HERO — the film opens, and the counter is already lit.
 *
 * A full-viewport scene like the home chapters, but this one sells: the
 * statement sits lower-left, and lower-right a glass panel holds three
 * references with instant quick-add — VISAGE, BEAUTY, DISCOVERY, PRODUCTS
 * and ACTION inside the first viewport. On phones the panel becomes a
 * snap strip under the statement; the scene grows rather than clips.
 */
export function VisageHero({
  name,
  description,
  cinema,
  copy,
  index,
  total,
  quick,
  basePath,
  productCount,
}: {
  name: string;
  description: string | null;
  cinema: UniverseCinema;
  copy: Copy;
  index: number;
  total: number;
  quick: PC[];
  basePath: string;
  productCount: number;
}) {
  const reduce = useReducedMotion();
  const pad = (n: number) => String(n).padStart(2, "0");

  const scrollToRitual = () => {
    document.getElementById("rituel")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-label={`${name} — ${cinema.title}`} className="relative min-h-svh overflow-hidden bg-night">
      <div className="absolute inset-0">
        <FilmPlate
          eager
          sources={{ desktop: `/videos/${cinema.video}.mp4`, mobile: `/videos/${cinema.video}-mobile.mp4` }}
          poster={`/videos/posters/${cinema.poster}.jpg`}
          alt=""
          className="h-full w-full"
        />
      </div>
      <FilmVeil deep />

      <motion.div
        variants={reduce ? undefined : container}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="container-wide relative z-10 flex min-h-svh flex-col justify-end gap-10 pb-10 pt-32 sm:pb-14 lg:flex-row lg:items-end lg:gap-14"
      >
        {/* The statement */}
        <div className="min-w-0 flex-1">
          <motion.div variants={reduce ? undefined : rise}>
            <Breadcrumbs light items={[{ label: copy.univers.breadcrumb }, { label: name }]} />
          </motion.div>
          <motion.p variants={reduce ? undefined : rise} className="mt-8 flex items-center gap-4" aria-hidden>
            <span className="cine-index">
              {pad(index)} / {pad(total)}
            </span>
            <span className="h-px w-10 bg-film-line" />
            <span className="cine-kicker">
              {name} — {cinema.kicker}
            </span>
          </motion.p>
          <div className="mt-6 overflow-hidden pb-[0.1em]">
            <motion.h1 variants={reduce ? undefined : maskRise} className="cine-title max-w-[16ch]">
              {cinema.title}
            </motion.h1>
          </div>
          {description && (
            <motion.p variants={reduce ? undefined : rise} className="mt-5 max-w-md text-[14.5px] leading-[1.85] text-haze">
              {description}
            </motion.p>
          )}
          <motion.div variants={reduce ? undefined : rise}>
            <button onClick={scrollToRitual} className="cine-cta mt-8" aria-label={`${copy.common.discover} — ${name}`}>
              {copy.common.discover}
              <ArrowDownIcon size={13} strokeWidth={1.5} aria-hidden />
            </button>
          </motion.div>
        </div>

        {/* The lit counter — three references, one gesture each */}
        {quick.length > 0 && (
          <motion.aside
            variants={reduce ? undefined : rise}
            aria-label={copy.merch.roomEyebrow}
            className="w-full shrink-0 border border-film-line bg-night/60 backdrop-blur-md lg:w-[21rem]"
          >
            <p className="flex items-center justify-between gap-3 border-b border-film-line px-5 py-3.5">
              <span className="cine-kicker">{copy.merch.roomEyebrow}</span>
            </p>
            <ul className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 py-5 lg:block lg:space-y-5 lg:overflow-visible lg:py-5">
              {quick.map((p) => (
                <li key={p.id} className="w-60 shrink-0 snap-start lg:w-auto">
                  <CineQuick p={p} priority />
                </li>
              ))}
            </ul>
            <p className="border-t border-film-line px-5 py-3.5">
              <Link
                href={`${basePath}#selection`}
                className="group inline-flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-haze transition-colors duration-500 hover:text-cinabre-3"
              >
                {fmt(copy.merch.roomAll, { n: productCount })}
                <ArrowRightIcon size={12} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" aria-hidden />
              </Link>
            </p>
          </motion.aside>
        )}
      </motion.div>
    </section>
  );
}
