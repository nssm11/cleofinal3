import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ProductImage } from "@/components/catalog/product-image";
import { Reveal } from "@/components/motion/reveal";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

export type CollectionMeta = { n: number; image: string | null };

/**
 * LES COLLECTIONS — six chambers named like chapters.
 *
 * No card grid: a ledger of great names, each row its own door. Under the
 * hand, a plate tilts into view — a whisper of what the chamber holds —
 * and the count keeps the poetry honest.
 */
export function CollectionIndex({
  rooms,
  meta,
}: {
  rooms: { id: number; slug: string; name: string }[];
  meta: Record<string, CollectionMeta>;
}) {
  const ed = VISAGE_EDITION.collections;
  return (
    <section id="collections" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <div className="container-wide py-20 lg:py-28">
        <Reveal amount={0.1}>
          <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`${NOIR_EYEBROW} mb-6 flex items-center gap-4`}>
                <span aria-hidden className="h-px w-10 bg-cine-gold/60" />
                {ed.kicker}
              </p>
              <h2 className="font-display font-light leading-[1.02] tracking-[-0.02em] text-cine-ivory">
                <span className="text-[clamp(2.1rem,4.2vw,3.4rem)]">{ed.title}</span>{" "}
                <span className="text-[clamp(2.1rem,4.2vw,3.4rem)] italic text-cine-gold">{ed.titleItalic}</span>
              </h2>
            </div>
          </div>
        </Reveal>

        <ul>
          {rooms.map((c, i) => {
            const m = meta[c.slug] ?? { n: 0, image: null };
            return (
              <Reveal key={c.id} as="li" y={12} delay={i * 0.04} amount={0.1}>
                <Link
                  href={`/categorie/${c.slug}`}
                  className="group relative flex items-center gap-5 overflow-hidden border-t border-cine-line py-6 transition-colors duration-500 last:border-b lg:gap-8 lg:py-8"
                >
                  {/* The tilted plate that answers the hand — desktop only. */}
                  {m.image && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-[16%] top-1/2 hidden h-44 w-36 -translate-y-1/2 rotate-[-5deg] scale-90 overflow-hidden bg-marble opacity-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[-2deg] group-hover:scale-100 group-hover:opacity-100 lg:block"
                    >
                      <ProductImage src={m.image} alt="" sizes="144px" className="object-cover" />
                    </span>
                  )}

                  <span className="w-8 shrink-0 font-display text-[13px] italic text-cine-gold/60 transition-colors duration-500 group-hover:text-cine-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 font-display font-light leading-none tracking-[-0.015em] text-cine-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-cine-gold lg:group-hover:translate-x-3">
                    <span className="block truncate text-[clamp(1.8rem,4vw,3rem)]">{c.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-5">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-cine-faint transition-colors duration-500 group-hover:text-cine-mist">
                      {m.n} {m.n > 1 ? ed.refs : ed.ref}
                    </span>
                    <span
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center border border-cine-line text-cine-faint transition-all duration-500 group-hover:border-cine-gold/70 group-hover:text-cine-gold"
                    >
                      <ArrowRightIcon size={15} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
