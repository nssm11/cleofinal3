import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";

/**
 * VisageNextChapters — the room beyond the room.
 *
 * The old page ended with a modest list of names set in display type. The
 * rebuilt Visage closes like the film does: a dark band, one scene card per
 * remaining chapter with its own footage still, index number and name. On the
 * desk they read as one row of six plates; on the phone they snap-scroll, so
 * the exit is a movement, not a paragraph.
 */

export type Chapter = { slug: string; name: string; image: string | null };

export function VisageNextChapters({ others, currentIndex, total }: { others: Chapter[]; currentIndex: number; total: number }) {
  if (others.length === 0) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <section aria-label="Les autres univers" className="grain relative overflow-hidden bg-cine-noir text-cine-ivory">
      <div className="container-wide pb-16 pt-14 lg:pb-20 lg:pt-16">
        <Reveal y={12}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-cine-line pb-5">
            <p className="cine-kicker">Les autres salles de la maison</p>
            <span className="flex items-center gap-4">
              <span className="cine-index">
                VOUS ÊTES ICI — {pad(currentIndex + 1)} / {pad(total)}
              </span>
              <span aria-hidden className="hidden h-px w-8 bg-cine-line sm:block" />
              <Link href="/boutique" className="cine-cta min-h-0! text-[11px]!">
                Toute la maison
                <ArrowRightIcon size={12} strokeWidth={1.6} className="rtl-mirror" aria-hidden />
              </Link>
            </span>
          </div>
        </Reveal>

        <ul className="scrollbar-none -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10 lg:overflow-visible lg:px-0 xl:grid-cols-6">
          {others.map((o, i) => (
            <Reveal key={o.slug} as="li" y={14} delay={i * 0.045} className="w-[62%] max-w-[240px] shrink-0 snap-start sm:w-[42%] lg:w-auto lg:max-w-none">
              <Link href={`/univers/${o.slug}`} className="group block">
                <span className="plate relative block aspect-[4/5] overflow-hidden">
                  {o.image ? (
                    <Image
                      src={o.image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 200px, (min-width: 1024px) 30vw, 42vw"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                  ) : (
                    <span aria-hidden className="absolute inset-0 bg-noir-2" />
                  )}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-cine-noir/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="cine-index absolute left-3 top-3 bg-cine-noir/55 px-1.5 py-0.5 backdrop-blur-sm">
                    {pad(i + 1)}
                  </span>
                </span>
                <p className="mt-3 flex items-baseline justify-between gap-3 pb-1">
                  <span className="min-w-0 truncate font-display text-[17px] italic leading-snug text-cine-ivory/85 transition-colors duration-500 group-hover:text-cine-gold">
                    {o.name}
                  </span>
                  <ArrowRightIcon size={13} className="shrink-0 text-cine-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-cine-gold rtl-mirror" aria-hidden />
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
