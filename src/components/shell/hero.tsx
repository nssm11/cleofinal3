"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, SparkIcon } from "@/components/icons";
import { Atmosphere, Parallax } from "@/components/motion/atmosphere";
import { MaskLine } from "@/components/motion/reveal";
import { formatDT } from "@/lib/money";
import { EASE_LUXE, D } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";

/**
 * LA VITRINE — the entrance to the house.
 *
 * Five layers, each moving at its own speed, and none of them moving far:
 *
 *   1 · the room      marble veil, ribs and grain
 *   2 · architecture  outlined arcs drawn in champagne, at 3 degrees of depth
 *   3 · photography   a tall plate that bleeds past the right edge
 *   4 · object        the featured product floating over the plate
 *   5 · voice         the headline, printed line by line
 *
 * Everything is transform-only and one-shot. On touch hardware the pointer
 * layers stand still; with `prefers-reduced-motion` the whole composition is
 * simply composed, which is the point — the motion is depth, not content.
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

export function Hero({
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
  // The composition separates gently as the visitor leaves it: the photograph
  // descends, the words rise, both by a few dozen pixels at most.
  const plateY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const voiceY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -34]);
  const voiceOpacity = useTransform(scrollYProgress, [0, 0.72], [1, reduce ? 1 : 0.15]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-paper pb-14 pt-24 lg:pb-20 lg:pt-32"
      aria-labelledby="hero-title"
    >
      <Atmosphere />

      {/* ── 2 · ARCHITECTURE ──────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Parallax depth={7} scroll={0.1} className="absolute -right-[16%] top-[-14%] h-[86vh] w-[86vh]">
          <div className="h-full w-full rounded-full border border-champagne/22" />
        </Parallax>
        <Parallax depth={12} scroll={0.16} className="absolute -right-[6%] top-[6%] h-[62vh] w-[62vh]">
          <div className="h-full w-full rounded-full border border-champagne-3/25" />
        </Parallax>
        <Parallax depth={4} scroll={0.07} className="absolute left-[-10%] bottom-[-22%] h-[58vh] w-[58vh]">
          <div className="h-full w-full rounded-full bg-champagne-soft/35 blur-3xl" />
        </Parallax>
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-stone-2/35 to-transparent" />
        <div className="absolute inset-x-0 top-2/3 h-px bg-gradient-to-r from-transparent via-stone-2/25 to-transparent" />
      </div>

      <div className="relative container-wide grid gap-12 lg:grid-cols-12 lg:gap-8">
        {/* ── 5 · VOICE ──────────────────────────────────────────────── */}
        <motion.div style={{ y: voiceY, opacity: voiceOpacity }} className="lg:col-span-7 lg:pt-6">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 0.1 }}
            className="rule-label"
          >
            {t.eyebrow}
          </motion.p>

          <h1
            id="hero-title"
            className="mt-8 font-display text-[clamp(2.9rem,7.4vw,6.4rem)] leading-[0.92] tracking-[-0.032em] text-ink"
          >
            <span className="sr-only">{t.titleSr}</span>
            <span aria-hidden>
              <MaskLine delay={0.22}>{t.titleLine1}</MaskLine>
              <MaskLine delay={0.32} className="italic text-champagne-2">
                {t.titleLine2}
              </MaskLine>
              <MaskLine delay={0.42}>
                {t.titleLine3a}
                <span className="italic">{t.titleLine3b}</span>
              </MaskLine>
            </span>
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 0.72 }}
            className="mt-7 max-w-[34rem] text-[15.5px] leading-[1.85] text-muted"
          >
            {t.intro1}
            <em className="not-italic text-charcoal">{t.introAccent}</em>
            {t.intro2}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 0.86 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/boutique" className="btn-primary">
              {t.shopCta} <ArrowRightIcon size={13} className="rtl-mirror" />
            </Link>
            <Link href="/diagnostic" className="btn-ghost">
              {t.adviceCta}
            </Link>
          </motion.div>

          {/* The seven rayons, as one line of type */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: D.slow, ease: EASE_LUXE, delay: 1.05 }}
            className="mt-12 border-t border-stone/70 pt-5"
          >
            <p className="eyebrow text-muted-2">{t.rayons}</p>
            <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
              {universes.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={`/univers/${u.slug}`}
                    className="link-underline font-display text-[17px] text-charcoal transition-colors hover:text-champagne-2"
                  >
                    {u.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* ── 3 & 4 · PHOTOGRAPHY + OBJECT ───────────────────────────── */}
        <div className="relative lg:col-span-5">
          <motion.div
            style={{ y: plateY }}
            initial={reduce ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: EASE_LUXE, delay: 0.15 }}
            className="relative aspect-[4/5] w-full lg:-mr-[9vw] lg:w-[calc(100%+9vw)]"
          >
            <div className="absolute inset-0 overflow-hidden bg-marble">
              <Image
                src="/images/hero.jpg"
                alt={t.photoAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/28 via-transparent to-transparent"
              />
            </div>

            {/* The vertical rail over the plate */}
            <span
              aria-hidden
              className="absolute bottom-6 left-5 hidden text-[9px] font-bold uppercase tracking-[0.3em] text-paper/70 lg:block"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {t.edition}
            </span>
          </motion.div>

          {/* The floating object: the product the house is proudest of today */}
          {hero && (
            <Parallax depth={18} className="absolute -bottom-8 left-2 w-[78%] max-w-[19rem] lg:-left-16 lg:bottom-4 lg:w-[62%]">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: D.grand, ease: EASE_LUXE, delay: 0.6 }}
              >
                <Link
                  href={`/produit/${hero.slug}`}
                  className="group surface block p-3 backdrop-blur-xl transition-transform duration-700 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="relative h-[74px] w-[62px] shrink-0 overflow-hidden bg-marble">
                      {hero.image && (
                        <Image
                          src={hero.image}
                          alt=""
                          fill
                          sizes="62px"
                          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-champagne-2">
                        <SparkIcon size={11} /> {t.choice}
                      </span>
                      <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.22em] text-muted-2">
                        {hero.brandName}
                      </span>
                      <span className="mt-1 block line-clamp-2 font-display text-[16px] leading-tight text-ink">
                        {hero.name}
                      </span>
                      <span className="mt-1.5 block text-[13px] tabular-nums text-ink">
                        {formatDT(hero.priceMillimes)}
                        {hero.compareAtMillimes && (
                          <span className="ml-2 text-[11px] text-muted-2 line-through">
                            {formatDT(hero.compareAtMillimes)}
                          </span>
                        )}
                      </span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            </Parallax>
          )}
        </div>
      </div>
    </section>
  );
}
