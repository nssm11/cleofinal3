"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Curtain } from "@/components/motion/reveal";
import { EASE_LUXE, D } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";

/**
 * LES RAYONS — the seven universes as one composition.
 *
 * Seven plates in two tight rows — three on top, four underneath — with short
 * photographic ratios: the section must read like a gallery wall, dense and
 * assured, not like a stack of posters. Hovering lifts the plate a hair and
 * surfaces its sentence *over* the photograph, so nothing below the grid ever
 * shifts. On a phone the collage becomes a short rail you swipe.
 */
export type CollageUniverse = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  childCount: number;
};

const ROW_1 = 3;

export function UniversesCollage({ universes }: { universes: CollageUniverse[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const rows: CollageUniverse[][] = [universes.slice(0, ROW_1), universes.slice(ROW_1)];

  return (
    <>
      {/* ── Desktop & tablet: the two-row wall ────────────────────────── */}
      <div className="hidden gap-x-5 gap-y-5 sm:grid sm:grid-cols-4 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-6">
        {rows.map((row, r) => (
          <div
            key={r}
            className="col-span-full grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-6"
          >
            {row.map((u, j) => {
              const i = r * ROW_1 + j;
              const isActive = active === u.id;
              const span = r === 0 ? "lg:col-span-4" : j === row.length - 1 && row.length === 4 ? "lg:col-span-3" : "lg:col-span-3";
              return (
                <Curtain key={u.id} className={`${span} col-span-1`} delay={i * 0.04} from="bottom">
                  <motion.div
                    onMouseEnter={() => setActive(u.id)}
                    onMouseLeave={() => setActive(null)}
                    animate={reduce ? undefined : { y: isActive ? -4 : 0 }}
                    transition={{ duration: D.fast, ease: EASE_LUXE }}
                    className="group relative h-full"
                  >
                    <Link href={`/univers/${u.slug}`} className="block h-full">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-marble lg:aspect-[16/9]">
                        {u.image && (
                          <Image
                            src={u.image}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
                            className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                          />
                        )}
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/8 to-transparent transition-opacity duration-700"
                          style={{ opacity: isActive ? 1 : 0.88 }}
                        />
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-champagne/14 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                        />

                        {/* Index + name, pinned to the plate */}
                        <span className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3 lg:inset-x-5 lg:bottom-4">
                          <span className="min-w-0">
                            <span className="block font-display text-[10px] italic text-paper/55">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="mt-0.5 block font-display text-[clamp(1.15rem,1.9vw,1.7rem)] leading-none text-paper">
                              {u.name}
                            </span>
                            {/* The sentence surfaces over the photograph — the grid never moves. */}
                            <span
                              className="mt-1.5 hidden max-w-[26rem] text-[11.5px] leading-snug text-paper/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block"
                            >
                              {u.description}
                            </span>
                            <span className="mt-1.5 block text-[9.5px] font-bold uppercase tracking-[0.18em] text-paper/55 lg:group-hover:hidden">
                              {u.childCount} {copy.common.categories}
                            </span>
                          </span>
                          <ArrowRightIcon
                            size={16}
                            className="mb-1 shrink-0 text-paper/60 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-paper rtl-mirror"
                          />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                </Curtain>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Phone: a short rail ───────────────────────────────────────── */}
      <div className="sm:hidden">
        <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-1">
          {universes.map((u, i) => (
            <li key={u.id} className="w-[68vw] shrink-0 snap-start">
              <Link href={`/univers/${u.slug}`} className="block">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-marble">
                  {u.image && <Image src={u.image} alt="" fill sizes="68vw" className="object-cover" />}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/8 to-transparent" />
                  <span className="absolute inset-x-4 bottom-3">
                    <span className="block font-display text-[10px] italic text-paper/55">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-0.5 block font-display text-[22px] leading-none text-paper">{u.name}</span>
                    <span className="mt-1.5 block text-[9.5px] font-bold uppercase tracking-[0.18em] text-paper/55">
                      {u.childCount} {copy.common.categories}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
          {copy.home.rayonsSwipe}
        </p>
      </div>
    </>
  );
}
