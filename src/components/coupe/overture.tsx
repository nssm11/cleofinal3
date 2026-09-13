"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CoupeLabel } from "./parts";
import { useLocale } from "@/lib/i18n/client";

/**
 * PLANCHE 00 — L'ENTRÉE.
 *
 * Not a hero: a façade. The first screen is the front wall of the house,
 * drawn as an engraving — one colossal carved wordmark, a course of stone,
 * seven horseshoe arches along the base (the rayons themselves, doors first,
 * pictures later) and a plaque of the house's real facts. There is no
 * sentence pretending to be a mission; the wall *is* the proposition.
 *
 * On desktop the wall is pinned for one beat: scrolling lifts the façade
 * like a set piece, the wordmark drifts up and out, the arcade rises a
 * fraction — the visitor literally enters under the arches. On mobile the
 * wall simply stands there and the arcade is a rail you swipe.
 */
export function Overture({
  facts,
  universes,
}: {
  facts: { refs: number; arcades: number; houses: number; boutiques: number };
  universes: { slug: string; name: string; childCount: number; image: string | null }[];
}) {
  const { copy } = useLocale();
  const t = copy.coupe.overture;
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLElement>(null);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end start"] });
  const live = desktop && !reduce;
  const wallY = useTransform(scrollYProgress, [0, 1], [0, live ? -170 : 0]);
  const wallOpacity = useTransform(scrollYProgress, [0, 0.8], [1, live ? 0.12 : 1]);
  const arcadeY = useTransform(scrollYProgress, [0, 1], [0, live ? 46 : 0]);
  const subOpacity = useTransform(scrollYProgress, [0, 0.4], [1, live ? 0 : 1]);

  const askSearch = () => window.dispatchEvent(new Event("coupe:search"));

  return (
    <section
      id="planche-entree"
      ref={wrap}
      aria-labelledby="overture-h1"
      className={`relative bg-plaster ${desktop ? "lg:h-[124vh]" : ""}`}
    >
      <div
        className={`relative overflow-hidden ${
          desktop ? "lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col" : "flex min-h-[100svh] flex-col"
        }`}
      >
        {/* The wall itself: plaster, courses of stone, one soft vignette. */}
        <div aria-hidden className="reg-wall absolute inset-0" />
        <div aria-hidden className="grain absolute inset-0 opacity-60" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-plaster-3/70 to-transparent" />
        <p aria-hidden className="rail-label absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 text-stone-2 lg:block">
          {t.kicker}
        </p>

        <motion.div
          style={desktop ? { y: wallY, opacity: wallOpacity } : undefined}
          className="relative z-10 mx-auto flex w-full max-w-[108rem] flex-1 flex-col px-4 pb-5 pt-20 sm:px-6 lg:px-10 lg:pt-24"
        >
          {/* The lintel: plate index, place. */}
          <div className="flex items-center justify-between gap-6 border-b border-stone-2/45 pb-3">
            <CoupeLabel>{t.kicker}</CoupeLabel>
            <p className="hidden items-center gap-3 text-[9px] font-extrabold uppercase tracking-[0.3em] text-muted-2 sm:flex">
              <span aria-hidden className="h-1 w-1 rotate-45 bg-brass" />
              Tunis · Ezzahra — Hammam-Lif
            </p>
          </div>

          {/* The carved name — typography as architecture. */}
          <div className="mt-auto pt-16 lg:pt-10">
            <h1 id="overture-h1" className="sr-only">
              {t.sr}
            </h1>
            <motion.p
              aria-hidden
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="select-none font-display uppercase leading-[0.82] tracking-[0.02em] reg-engrave whitespace-nowrap text-[clamp(3rem,12.4vw,10.6rem)]"
            >
              Cléopâtre
            </motion.p>
            <motion.p
              style={desktop ? { opacity: subOpacity } : undefined}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.9] text-muted lg:mt-6 lg:text-[15px]"
            >
              {t.sub}
            </motion.p>
          </div>

          {/* The plaque of facts + the only two ways in. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-12 lg:items-end"
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-stone-2/55 pt-4 sm:grid-cols-4 lg:col-span-7">
              {(
                [
                  [facts.refs, t.factRefs],
                  [facts.arcades, t.factArcades],
                  [facts.houses, t.factHouses],
                  [facts.boutiques, t.factBoutiques],
                ] as [number, string][]
              ).map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-[clamp(1.5rem,2.3vw,2rem)] leading-none text-ink">{n}</dd>
                  <p className="mt-1.5 text-[8.5px] font-extrabold uppercase leading-relaxed tracking-[0.2em] text-muted-2">{label}</p>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-5 lg:justify-end">
              <Link
                href="#planche-etages"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("planche-etages")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                }}
                className="group inline-flex min-h-[46px] items-center gap-3 bg-ink px-6 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-plaster transition-colors duration-500 hover:bg-brass"
              >
                {t.enter}
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-y-0.5">↓</span>
              </Link>
              <button
                type="button"
                onClick={askSearch}
                className="inline-flex min-h-[46px] items-center gap-2 border-b border-ink/30 pb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-ink transition-colors duration-300 hover:border-brass hover:text-brass"
              >
                {t.search}
              </button>
            </div>
          </motion.div>

          {/* THE ARCADES — the seven rayons as a colonnade, doors of the house. */}
          <motion.div style={desktop ? { y: arcadeY } : undefined} className="mt-7 lg:mt-9">
            <div className="flex items-end justify-between gap-4">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-charcoal-2">{t.arcHint}</p>
              <p aria-hidden className="hidden text-[9px] font-extrabold uppercase tracking-[0.24em] text-muted-2 lg:block">
                {copy.home.rayonsIndex}
              </p>
            </div>

            {/* Desktop: seven arches standing on one continuous line. */}
            <div className="mt-3 hidden sm:block">
              <ul className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-2.5">
                {universes.map((u, i) => (
                  <li key={u.slug}>
                    <Link href={`/univers/${u.slug}`} className="group block outline-offset-4">
                      <span
                        className="reg-arch reg-rise relative block h-[clamp(110px,15vh,170px)] overflow-hidden border border-ink/15 bg-gradient-to-b from-[#efe7d2] to-[#e0d4b6] transition-[border-color,box-shadow] duration-700 group-hover:border-brass/60 group-hover:shadow-[inset_0_-18px_36px_-24px_rgba(138,106,47,0.65)]"
                        style={{ animationDelay: `${0.65 + i * 0.09}s` }}
                      >
                        {u.image && (
                          <span aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-[900ms] ease-out group-hover:opacity-100">
                            <Image src={u.image} alt="" fill sizes="15vw" className="object-cover" />
                          </span>
                        )}
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#d8c9a4]/60 via-transparent to-[#f7f0df]/70 transition-opacity duration-700 group-hover:opacity-40" />
                        <span className="absolute inset-x-0 top-3 text-center font-display text-[12px] italic text-brass transition-opacity duration-500 group-hover:opacity-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="absolute inset-x-0 bottom-4 mx-auto h-8 w-px origin-top bg-brass/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </span>
                      <span className="mt-2 flex items-baseline justify-between gap-2 px-0.5">
                        <span className="text-[8.5px] font-extrabold uppercase tracking-[0.18em] text-charcoal-2 transition-colors duration-300 group-hover:text-brass">
                          {u.name}
                        </span>
                        <span className="hidden text-[8px] font-extrabold tabular-nums tracking-[0.14em] text-muted-2 xl:inline">
                          {u.childCount}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div aria-hidden className="relative mt-0 h-px w-full bg-stone">
                <span className="absolute -bottom-[3px] ltr:left-0 rtl:right-0 h-1 w-1 rotate-45 bg-brass/70" />
                <span className="absolute -bottom-[3px] ltr:right-0 rtl:left-0 h-1 w-1 rotate-45 bg-brass/70" />
              </div>
            </div>

            {/* Phone: the colonnade becomes a rail you walk past. */}
            <ul className="scrollbar-none -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:hidden">
              {universes.map((u, i) => (
                <li key={u.slug} className="w-[52vw] shrink-0 snap-start">
                  <Link href={`/univers/${u.slug}`} className="group block">
                    <span className="reg-arch relative block h-[150px] overflow-hidden border border-ink/12">
                      {u.image && <Image src={u.image} alt="" fill sizes="52vw" className="object-cover" />}
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/10 to-transparent" />
                      <span className="absolute inset-x-3 bottom-3">
                        <span className="block font-display text-[11px] italic text-plaster/60">{String(i + 1).padStart(2, "0")}</span>
                        <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-plaster">{u.name}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* The cue: a plumb line dropping into the next register. */}
          <div className="mt-4 hidden items-center gap-3 lg:mt-5 lg:flex">
            <span aria-hidden className="reg-cue h-8 w-px bg-brass/70" />
            <span className="text-[8.5px] font-extrabold uppercase tracking-[0.3em] text-muted-2">{t.cue}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
