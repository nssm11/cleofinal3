"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CoupeLabel } from "./parts";
import { fmt } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import { EASE_LUXE, D } from "@/lib/motion";
import type { CoupeUniverse } from "./types";

/**
 * PLANCHE 02 — LES ARCÉES (the floors).
 *
 * The seven rayons are not tiles; they are the storey line of the house.
 * One row per floor, set as an index: chiselled numeral, name at the scale of
 * a door, count of categories hanging at the far rule. On a fine pointer the
 * hovered floor answers back: an arched window glides in over the margin,
 * breathing under the cursor, carrying the rayon's photograph, its sentence
 * and the names of the categories kept behind its door. On a finger there is
 * no window — the row itself is the whole interaction, and it navigates.
 */

/** One line wipes in from the left, the way a rule is drawn on a plan. */
function DrawnRow({ children, i }: { children: React.ReactNode; i: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { clipPath: "inset(0 100% 0 0)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, ease: EASE_LUXE, delay: Math.min(i, 6) * 0.05 }}
      className="border-b border-stone"
    >
      {children}
    </motion.li>
  );
}

export function Floors({ universes }: { universes: CoupeUniverse[] }) {
  const { copy } = useLocale();
  const t = copy.coupe.etages;
  const reduce = useReducedMotion();
  const area = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [y, setY] = useState(240);
  const [boxH, setBoxH] = useState(640);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setFine(mq.matches && !reduce);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [reduce]);

  const cats = universes.reduce((n, u) => n + u.children.length, 0);

  return (
    <section id="planche-etages" aria-label={t.title} className="relative border-y border-stone bg-plaster">
      <div ref={area} className="relative mx-auto w-full max-w-[108rem] px-4 py-16 sm:px-6 lg:px-10 lg:py-24" onMouseMove={(e) => { if (fine && area.current) { const r = area.current.getBoundingClientRect(); setY(e.clientY - r.top); } }}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <div>
            <CoupeLabel>{t.index}</CoupeLabel>
            <h2 className="mt-3 font-display uppercase leading-[0.95] tracking-[0.01em] text-[clamp(1.7rem,4.2vw,3rem)] text-ink">
              {fmt(t.title, { n: universes.length, m: cats })}
            </h2>
          </div>
          <p className="max-w-[38ch] text-[12.5px] leading-relaxed text-muted lg:text-[13.5px]">{t.sub}</p>
        </div>

        <ul className="mt-8 border-t border-stone lg:mt-10">
          {universes.map((u, i) => (
            <DrawnRow key={u.slug} i={i}>
              <Link
                href={`/univers/${u.slug}`}
                onMouseEnter={() => fine && setHovered(i)}
                onMouseLeave={() => fine && setHovered(null)}
                onFocus={() => fine && setHovered(i)}
                onBlur={() => fine && setHovered(null)}
                className="group relative -mx-4 flex items-center gap-5 px-4 py-4 sm:mx-0 sm:px-0 lg:py-6"
              >
                <span className="w-12 shrink-0 font-display text-[clamp(1.25rem,2.4vw,1.9rem)] italic leading-none reg-incise lg:w-16">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display uppercase leading-[1.02] tracking-[0.005em] text-[clamp(1.35rem,4.4vw,2.75rem)] text-ink transition-colors duration-500 group-hover:text-brass">
                    {u.name}
                  </span>
                  <span className="mt-1 block truncate text-[11.5px] text-muted lg:text-[12.5px]">{u.description}</span>
                </span>
                <span className="hidden shrink-0 items-baseline gap-2 lg:flex">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-muted-2">
                    {u.children.length} {copy.common.categories}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-[16px] text-sand-2 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-brass rtl-mirror">
                  →
                </span>
              </Link>
            </DrawnRow>
          ))}
        </ul>

        {/* The window that answers the hovered floor. */}
        <AnimatePresence>
          {fine && hovered !== null && universes[hovered] && (
            <motion.aside
              key={universes[hovered].slug}
              aria-hidden
              initial={{ opacity: 0, x: 26, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: Math.max(40, Math.min(y - 190, boxH - 400)) }}
              exit={{ opacity: 0, x: 34, scale: 0.985 }}
              transition={{ duration: D.base, ease: EASE_LUXE }}
              className="pointer-events-none absolute ltr:right-0 rtl:left-0 top-0 z-20 hidden w-[clamp(15rem,20vw,19rem)] lg:block"
            >
              <div className="surface overflow-hidden p-3 shadow-float">
                <div className="reg-arch relative h-[19rem] w-full overflow-hidden bg-marble">
                  {universes[hovered].image && (
                    <Image src={universes[hovered].image} alt="" fill sizes="30vw" className="object-cover" priority={false} />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                  <span className="absolute inset-x-4 bottom-4 text-[9px] font-extrabold uppercase tracking-[0.26em] text-plaster">
                    {universes[hovered].children.slice(0, 4).map((c) => c.name).join(" · ")}
                  </span>
                </div>
                <p className="mt-3 flex items-center justify-between gap-3 px-1 text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-brass">
                  {t.enter}
                  <span aria-hidden className="rtl-mirror">→</span>
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
