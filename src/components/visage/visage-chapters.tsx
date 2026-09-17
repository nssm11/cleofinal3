import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type CineChapter = { slug: string; name: string; image: string | null };

/**
 * THE OTHER CHAPTERS — the rest of the film, as posters.
 *
 * Every other universe arrives as its own campaign still: the photograph,
 * the scrim, the film kicker, the name in the display face. A snap rail on
 * phones, a three-up gallery on desktop. The current room never appears.
 */
export function VisageChapters({ chapters, copy }: { chapters: CineChapter[]; copy: Copy }) {
  if (chapters.length === 0) return null;
  return (
    <section aria-label={copy.univers.otherRooms} className="border-t border-film-line bg-night">
      <div className="container-wide py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="cine-title">{copy.univers.otherRooms}</h2>
        </div>

        <ul className="scrollbar-none -mx-[var(--spacing-gutter)] mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--spacing-gutter)] pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {chapters.map((c) => {
            const cinema = UNIVERSE_CINEMA[c.slug];
            return (
              <li key={c.slug} className="w-64 shrink-0 snap-start sm:w-80 lg:w-auto">
                <Link
                  href={`/univers/${c.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden bg-night-2 lg:aspect-[4/5]"
                >
                  {c.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.image}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="cine-kicker text-cinabre-3!">{cinema?.kicker ?? copy.univers.label}</p>
                      <p className="mt-2 truncate font-display text-[24px] font-light leading-tight text-alabaster">{c.name}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-alabaster/30 text-alabaster backdrop-blur-sm transition-all duration-500 group-hover:border-cinabre-3 group-hover:bg-cinabre-3 group-hover:text-night">
                      <ArrowUpRightIcon size={15} aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
