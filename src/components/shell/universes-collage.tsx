"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Curtain } from "@/components/motion/reveal";
import { EASE_LUXE, D } from "@/lib/motion";

/**
 * LES RAYONS — the seven universes as one composition.
 *
 * Not a list and not a uniform grid: seven plates of four different widths,
 * arranged so the eye travels diagonally. Approaching a plate lifts it,
 * deepens its warmth and lets its sentence surface. On a phone the collage
 * becomes a horizontal rail — a different rhythm for a different grip.
 */
export type CollageUniverse = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  childCount: number;
};

/* Six spans across a twelve-column field, chosen so no two neighbours match. */
const SPANS = [
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-5",
  "lg:col-span-6 lg:col-start-4",
];
const HEIGHTS = [
  "aspect-[4/5]",
  "aspect-[4/5] lg:aspect-[16/13]",
  "aspect-[4/5]",
  "aspect-[4/5]",
  "aspect-[4/5] lg:aspect-[16/13]",
  "aspect-[4/5]",
  "aspect-[4/5] lg:aspect-[21/9]",
];

export function UniversesCollage({ universes }: { universes: CollageUniverse[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  return (
    <>
      {/* ── Desktop & tablet: the collage ───────────────────────────── */}
      <div className="hidden gap-x-6 gap-y-10 sm:grid sm:grid-cols-6 lg:grid-cols-12 lg:gap-x-7 lg:gap-y-14">
        {universes.map((u, i) => {
          const isActive = active === u.id;
          return (
            <Curtain key={u.id} className={`${SPANS[i % SPANS.length]} col-span-3`} delay={i * 0.045} from="bottom">
              <motion.div
                onMouseEnter={() => setActive(u.id)}
                onMouseLeave={() => setActive(null)}
                animate={reduce ? undefined : { y: isActive ? -6 : 0 }}
                transition={{ duration: D.fast, ease: EASE_LUXE }}
                className="group relative"
              >
                <Link href={`/univers/${u.slug}`} className="block">
                  <div className={`relative w-full overflow-hidden bg-marble ${HEIGHTS[i % HEIGHTS.length]}`}>
                    {u.image && (
                      <Image
                        src={u.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                      />
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/8 to-transparent transition-opacity duration-700"
                      style={{ opacity: isActive ? 1 : 0.86 }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-champagne/14 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />

                    {/* Index + name, pinned to the plate */}
                    <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 lg:inset-x-6 lg:bottom-6">
                      <span className="min-w-0">
                        <span className="block font-display text-[11px] italic text-paper/55">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="mt-1 block font-display text-[clamp(1.35rem,2.4vw,2.1rem)] leading-none text-paper">
                          {u.name}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-paper/55">
                          {u.childCount} catégories
                        </span>
                      </span>
                      <ArrowRightIcon
                        size={18}
                        className="mb-1 shrink-0 translate-x-0 text-paper/60 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-paper"
                      />
                    </span>
                  </div>
                </Link>

                {/* The sentence surfaces on approach */}
                <motion.p
                  initial={false}
                  animate={reduce ? undefined : { opacity: isActive ? 1 : 0, y: isActive ? 0 : 8 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  className="pointer-events-none mt-3 hidden text-[13px] leading-relaxed text-muted lg:block"
                >
                  {u.description}
                </motion.p>
              </motion.div>
            </Curtain>
          );
        })}
      </div>

      {/* ── Phone: a rail ───────────────────────────────────────────── */}
      <div className="sm:hidden">
        <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
          {universes.map((u, i) => (
            <li key={u.id} className="w-[74vw] shrink-0 snap-start">
              <Link href={`/univers/${u.slug}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-marble">
                  {u.image && (
                    <Image
                      src={u.image}
                      alt=""
                      fill
                      sizes="74vw"
                      className="object-cover"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/8 to-transparent" />
                  <span className="absolute inset-x-4 bottom-4">
                    <span className="block font-display text-[11px] italic text-paper/55">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block font-display text-[26px] leading-none text-paper">{u.name}</span>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-paper/55">
                      {u.childCount} catégories
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
          Faites glisser pour parcourir les sept rayons
        </p>
      </div>
    </>
  );
}
