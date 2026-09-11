"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Curtain } from "@/components/motion/reveal";
import { EASE_LUXE, D } from "@/lib/motion";

/**
 * LES RAYONS — the seven universes as one composition.
 *
 * Three even rows, and inside each row every plate shares one proportion:
 * three tall plates, then two pairs of wide ones. Sharing a proportion is what
 * keeps the composition tight — when plates of different heights sat in the
 * same row, the shorter ones left a band of empty page beneath them, and the
 * section read as sparse rather than as composed.
 *
 * Each plate carries its own sentence, printed over the photograph rather than
 * under it, so the caption never adds height to the row. Approaching a plate
 * lifts it and lets its warmth surface. On a phone the collage becomes a
 * horizontal rail — a different rhythm for a different grip.
 */
export type CollageUniverse = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  childCount: number;
};

/* Three rows of three, two and two. One proportion per row, so no plate is
   ever shorter than the row it sits in. */
const PLATES: ReadonlyArray<{ span: string; aspect: string }> = [
  { span: "sm:col-span-3 lg:col-span-4", aspect: "aspect-[4/5]" },
  { span: "sm:col-span-3 lg:col-span-4", aspect: "aspect-[4/5]" },
  { span: "sm:col-span-3 lg:col-span-4", aspect: "aspect-[4/5]" },
  { span: "sm:col-span-3 lg:col-span-6", aspect: "aspect-[4/5] lg:aspect-[16/10]" },
  { span: "sm:col-span-3 lg:col-span-6", aspect: "aspect-[4/5] lg:aspect-[16/10]" },
  { span: "sm:col-span-3 lg:col-span-6", aspect: "aspect-[4/5] lg:aspect-[16/10]" },
  { span: "sm:col-span-3 lg:col-span-6", aspect: "aspect-[4/5] lg:aspect-[16/10]" },
];

export function UniversesCollage({ universes }: { universes: CollageUniverse[] }) {
  const reduce = useReducedMotion();

  return (
    <>
      {/* ── Desktop & tablet: the collage ───────────────────────────── */}
      <div className="hidden gap-5 sm:grid sm:grid-cols-6 lg:grid-cols-12 lg:gap-6">
        {universes.map((u, i) => {
          const plate = PLATES[i % PLATES.length];
          return (
            <Curtain key={u.id} className={plate.span} delay={i * 0.04} from="bottom">
              <motion.div
                whileHover={reduce ? undefined : { y: -5 }}
                transition={{ duration: D.fast, ease: EASE_LUXE }}
                className="group relative"
              >
                <Link href={`/univers/${u.slug}`} className="block">
                  <div className={`relative w-full overflow-hidden bg-marble ${plate.aspect}`}>
                    {u.image && (
                      <Image
                        src={u.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                      />
                    )}
                    {/* The ground the caption is printed on — deepens on approach. */}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/25 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-champagne/14 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />

                    {/* Index, name, sentence — all inside the plate. */}
                    <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 lg:inset-x-5 lg:bottom-5">
                      <span className="min-w-0">
                        <span className="block font-display text-[11px] italic text-paper/60">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="mt-1 block font-display text-[clamp(1.2rem,2vw,1.75rem)] leading-none text-paper">
                          {u.name}
                        </span>
                        <span className="mt-1.5 block text-[9.5px] font-bold uppercase tracking-[0.2em] text-champagne-3/85">
                          {u.childCount} catégories
                        </span>
                        {u.description && (
                          <span className="mt-2 hidden max-w-[24rem] text-[12.5px] leading-relaxed text-paper/70 lg:line-clamp-2 lg:block">
                            {u.description}
                          </span>
                        )}
                      </span>
                      <ArrowRightIcon
                        size={18}
                        className="mb-1 shrink-0 translate-x-0 text-paper/60 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-paper"
                      />
                    </span>
                  </div>
                </Link>
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
                    <Image src={u.image} alt="" fill sizes="74vw" className="object-cover" />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/10 to-transparent" />
                  <span className="absolute inset-x-4 bottom-4">
                    <span className="block font-display text-[11px] italic text-paper/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block font-display text-[26px] leading-none text-paper">{u.name}</span>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-3/85">
                      {u.childCount} catégories
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
          Faites glisser pour parcourir les sept rayons
        </p>
      </div>
    </>
  );
}
