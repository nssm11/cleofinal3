"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Specimen } from "./specimen";
import { CoupeLabel } from "./parts";
import { fmt } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import type { ProductCard } from "@/lib/catalog";

/**
 * PLANCHE 01 — LE COMPTOIR.
 *
 * The house's flagship statement about its catalogue: the selection is not a
 * grid, it is a marble counter. On desktop the register pins and the vertical
 * scroll becomes a horizontal walk along it — twelve specimens in a row, one
 * lit niche each, a common stone line under every one of them, a floor-counter
 * reading 03/12 while you pass. The first object stands taller: it is today's
 * counter choice, with its notice read at the height of the eye.
 *
 * On phones there is no pin: the counter is simply a rail you swipe —
 * the same objects, the same order, native physics. `prefers-reduced-motion`
 * takes the same route: scroll never travels sideways through JavaScript.
 */

type Item = ProductCard & { brandName: string | null };

export function Counter({ items }: { items: Item[] }) {
  const { copy } = useLocale();
  const t = copy.coupe.counter;
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const pin = desktop && !reduce && items.length > 4;

  const wrap = useRef<HTMLElement>(null);

  return (
    <section ref={wrap} id="planche-comptoir" aria-label={t.title} className={`relative bg-plaster-2 ${pin ? "h-[calc(230vh)]" : ""} border-y border-stone`}>
      <div className={pin ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : ""}>
        {/* The plaque of the register */}
        <div className={`mx-auto w-full max-w-[108rem] px-4 sm:px-6 lg:px-10 ${pin ? "" : "pt-16"} pb-2`}>
          <div className="flex items-end justify-between gap-6 border-b border-stone-2/60 pb-3">
            <div>
              <CoupeLabel>{t.index}</CoupeLabel>
              <h2 className="mt-2 font-display text-[clamp(1.7rem,3.4vw,2.7rem)] uppercase leading-none tracking-[0.015em] text-ink">{t.title}</h2>
            </div>
            <p className="hidden max-w-[34ch] text-right text-[11.5px] leading-relaxed text-muted lg:block">{fmt(t.note, { n: items.length })}</p>
          </div>
        </div>

        {pin ? (
          <PinnedCounter items={items} scrollRef={wrap} />
        ) : (
          <div className="mx-auto w-full max-w-[108rem] px-4 pb-14 pt-4 sm:px-6 lg:px-10 lg:pb-20">
            <ul className="scrollbar-none -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 lg:grid lg:grid-cols-4 lg:gap-x-7 lg:overflow-visible lg:px-0">
              {items.map((p, i) => (
                <li key={p.id} className="w-[74vw] shrink-0 snap-start sm:w-[42vw] lg:w-auto">
                  <Specimen p={p} tight sizes={i === 0 ? "(max-width:1024px) 74vw, 24vw" : "(max-width:1024px) 74vw, 22vw"} priority={i < 3} feature={i === 0} overline={i === 0 ? t.choice : null} />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-6">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-2 lg:hidden">{t.swipe}</p>
              <Link href="/boutique?sort=bestsellers" className="btn-ghost ml-auto">
                {t.cta} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── The pinned walk ────────────────────────────────────────────────────── */

function PinnedCounter({ items, scrollRef }: { items: Item[]; scrollRef: React.RefObject<HTMLElement | null> }) {
  const { copy } = useLocale();
  const t = copy.coupe.counter;
  const strip = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const { scrollYProgress } = useScroll({ target: scrollRef as React.RefObject<HTMLElement>, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const measure = () => {
      if (!strip.current) return;
      const w = strip.current.scrollWidth - window.innerWidth;
      setTravel(Math.max(0, w));
    };
    measure();
    window.addEventListener("resize", measure);
    // Re-measure after images settle their boxes.
    const t = setTimeout(measure, 600);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [items.length]);

  useEffect(() => {
    let raf = 0;
    const unsub = scrollYProgress.on("change", (v) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = Math.min(items.length, Math.max(1, Math.round(v * (items.length - 1)) + 1));
        setIndex((prev) => (prev === next ? prev : next));
      });
    });
    return () => {
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollYProgress, items.length]);

  return (
    <div className="relative h-full">
      {/* The reading line of the strip, kept for the counter display. */}
      <motion.div style={{ x }} className="absolute inset-y-0 flex items-center">
        <div ref={strip} className="flex w-max items-end gap-x-7 pl-[max(2.5rem,calc((100vw-108rem)/2+2.5rem))] pr-[max(2.5rem,calc((100vw-108rem)/2+2.5rem))]">
          {/* The register's own statement, first on the counter. */}
          <figure className="mr-4 flex w-[clamp(17rem,24vw,23rem)] flex-col justify-end gap-4 self-stretch pb-[9.5rem]">
            <p className="font-display text-[clamp(1.5rem,2vw,1.9rem)] italic leading-snug text-ink">
              Le comptoir, ici, est une ligne —<br />
              <span className="not-italic text-brass">pas une grille.</span>
            </p>
            <p className="text-[11.5px] leading-relaxed text-muted">{fmt(t.note, { n: items.length })}</p>
            <Link href="/boutique?sort=bestsellers" className="btn-ghost self-start">
              {t.cta} →
            </Link>
          </figure>
          {items.map((p, i) => (
            <div key={p.id} className={`w-[clamp(13.5rem,15.5vw,16.5rem)] ${i === 0 ? "w-[clamp(15rem,18vw,19rem)]" : ""}`}>
              <Specimen
                p={p}
                tight
                sizes="(max-width: 1280px) 230px, 260px"
                priority={i < 4}
                feature={i === 0}
                overline={i === 0 ? t.choice : null}
                aspect={i === 0 ? "aspect-[3/4]" : "aspect-[4/5]"}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* The counter's own progress: numerals + hairline, bottom left. */}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-full max-w-[108rem] items-center gap-5 px-4 sm:px-6 lg:px-10">
        <p aria-live="polite" className="font-display text-[15px] tabular-nums text-ink">
          {String(index).padStart(2, "0")}
          <span className="text-muted-2"> / {String(items.length).padStart(2, "0")}</span>
        </p>
        <span aria-hidden className="relative h-px flex-1 bg-stone-2/60">
          <span
            className="absolute inset-y-0 ltr:left-0 rtl:right-0 bg-brass transition-[width] duration-200"
            style={{ width: `${Math.round(((index - 1) / Math.max(1, items.length - 1)) * 100)}%` }}
          />
        </span>
        <span aria-hidden className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-2">
          {t.index}
        </span>
      </div>
    </div>
  );
}
