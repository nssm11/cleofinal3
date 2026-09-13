"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, SparkIcon } from "@/components/icons";
import { MaskLine } from "@/components/motion/reveal";
import { Magnetic } from "./magnetic";
import { D, EASE_LUXE } from "@/lib/motion";
import { formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";

/**
 * HM - PLEIN CHAMP - the entrance as a magazine cover.
 *
 * No columns, no split: one full-bleed photographic field that opens from a
 * frame to the edges of the viewport, crossed by oversized typography that
 * begins on warm light and ends on the photograph itself. Commerce lives in
 * a bottom bar - the doors of the house - and the proudest reference floats
 * over the field's lower edge. Scroll sinks the field and lifts the voice.
 */

type HeroProduct = {
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  volume: string | null;
} | null;

export function HeroOuverture({
  hero,
  universes,
}: {
  hero: HeroProduct;
  universes: { slug: string; name: string }[];
}) {
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const t = copy.hero;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const fieldY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 130]);
  const fieldScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.07]);
  const voiceY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const voiceOpacity = useTransform(scrollYProgress, [0, 0.62], [1, reduce ? 1 : 0]);
  const barOpacity = useTransform(scrollYProgress, [0, 0.22], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative flex min-h-svh flex-col overflow-hidden">
      {/* 1 - THE FIELD: a frame that opens to the edges */}
      <motion.div
        data-reveal=""
        initial={reduce ? false : { clipPath: "inset(17% 9% 17% 9%)", opacity: 0.4 }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        transition={{ duration: 1.5, ease: EASE_LUXE, delay: 0.25 }}
        className="absolute inset-0"
      >
        <motion.div style={{ y: fieldY, scale: fieldScale }} className="absolute inset-0">
          <motion.div
            data-reveal=""
            initial={reduce ? false : { scale: 1.16 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: EASE_LUXE, delay: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src="/images/hero.jpg"
              alt={t.photoAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Legibility veils - warm light, never decoration */}
        <div
          aria-hidden
          className="absolute inset-0 rtl:-scale-x-100"
          style={{
            background:
              "linear-gradient(100deg, rgba(250,246,236,0.97) 0%, rgba(250,246,236,0.9) 32%, rgba(250,246,236,0.5) 54%, rgba(250,246,236,0.12) 68%, transparent 82%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-paper/90 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-braise/80 via-braise/35 to-transparent"
        />
        <div className="grain absolute inset-0" aria-hidden />
      </motion.div>

      {/* Edition rail over the field */}
      <motion.span
        aria-hidden
        data-reveal=""
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-[9px] font-bold uppercase tracking-[0.3em] text-paper/80 xl:block"
        style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
      >
        {t.edition}
      </motion.span>

      {/* 2 - THE VOICE: oversized, crossing from light onto photography */}
      <motion.div
        style={{ y: voiceY, opacity: voiceOpacity }}
        className="relative flex flex-1 flex-col justify-center pb-8 pt-28 sm:pt-32 lg:pt-36 [@media(max-height:820px)]:pt-24"
      >
        <div className="container-wide">
          <motion.p
            data-reveal=""
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 0.55 }}
            className="hm-kicker text-muted"
          >
            {t.eyebrow}
          </motion.p>

          <h1 id="hero-title" className="hm-display mt-6 text-[clamp(3.2rem,11.5vw,9.5rem)] text-ink sm:mt-8 [@media(max-height:820px)]:text-[clamp(2.8rem,8.5vw,6.5rem)]">
            <span className="sr-only">{t.titleSr}</span>
            <span aria-hidden>
              <MaskLine delay={0.7}>{t.titleLine1}</MaskLine>
              <MaskLine delay={0.82} className="italic text-champagne-2">
                {t.titleLine2}
              </MaskLine>
              <MaskLine delay={0.94}>
                {t.titleLine3a}
                <span className="italic">{t.titleLine3b}</span>
              </MaskLine>
            </span>
          </h1>

          <motion.p
            data-reveal=""
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 1.15 }}
            className="mt-6 max-w-md text-[14.5px] leading-[1.85] text-charcoal-2 sm:text-[15.5px]"
          >
            {t.intro1}
            <em className="not-italic text-ink">{t.introAccent}</em>
            {t.intro2}
          </motion.p>
        </div>
      </motion.div>

      {/* 3 - THE OBJECT: the proudest reference, over the field's edge */}
      {hero && (
        <motion.div
          style={{ opacity: voiceOpacity }}
          className="relative pb-5"
        >
          <div className="container-wide flex justify-start sm:justify-end">
            <motion.div
              data-reveal=""
              initial={reduce ? false : { opacity: 0, x: 44 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: D.grand, ease: EASE_LUXE, delay: 1.3 }}
              className="w-full max-w-sm"
            >
              <Link
                href={`/produit/${hero.slug}`}
                className="group flex items-center gap-4 border border-paper/20 bg-braise/55 p-3 backdrop-blur-xl transition-colors duration-500 hover:bg-braise/75"
              >
                <span className="relative h-[72px] w-[60px] shrink-0 overflow-hidden bg-marble">
                  {hero.image && (
                    <Image
                      src={hero.image}
                      alt=""
                      fill
                      sizes="60px"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-champagne-3">
                    <SparkIcon size={11} /> {t.choice}
                  </span>
                  <span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-[0.22em] text-paper/55">
                    {hero.brandName}
                  </span>
                  <span className="mt-1 block line-clamp-1 font-display text-[16px] leading-tight text-paper">
                    {hero.name}
                  </span>
                  <span className="mt-1 block text-[13px] tabular-nums text-paper">
                    {formatDT(hero.priceMillimes)}
                    {hero.compareAtMillimes && (
                      <span className="ml-2 text-[11px] tabular-nums text-paper/50 line-through">
                        {formatDT(hero.compareAtMillimes)}
                      </span>
                    )}
                  </span>
                </span>
                <ArrowRightIcon size={16} className="mr-1 shrink-0 text-paper/60 transition-all duration-500 group-hover:translate-x-1 group-hover:text-champagne-3 rtl-mirror" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* 4 - THE DOORS: a full-bleed commerce bar */}
      <motion.div style={{ opacity: barOpacity }} className="relative border-t border-paper/25 bg-braise/45 backdrop-blur-[6px]">
        <div className="container-wide flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:gap-10 lg:py-6 [@media(max-height:820px)]:py-3 [@media(max-height:820px)]:lg:py-4">
          <motion.div
            data-reveal=""
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 1.25 }}
            className="flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            <Magnetic strength={4}>
              <Link href="/boutique" className="btn-light">
                {t.shopCta} <ArrowRightIcon size={13} className="rtl-mirror" />
              </Link>
            </Magnetic>
            <Link href="/diagnostic" className="hm-link-light pb-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              {t.adviceCta}
            </Link>
          </motion.div>

          <motion.div
            data-reveal=""
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 1.45 }}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-2 lg:ml-auto"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-paper/50">{t.rayons}</span>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {universes.map((u) => (
                <li key={u.slug}>
                  <Link href={`/univers/${u.slug}`} className="hm-link-light font-display text-[16px]">
                    {u.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.7 }}
            className="hidden items-center gap-3 xl:flex"
          >
            <span className="relative h-9 w-px overflow-hidden bg-paper/25">
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 bg-champagne-3"
                animate={reduce ? undefined : { y: ["-100%", "220%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
              />
            </span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
