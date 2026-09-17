import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type CineRayon = {
  slug: string;
  name: string;
  description: string | null;
  count: number;
};

/**
 * THE RAYONS — the children, shelved beside their photograph.
 *
 * An asymmetric split: the universe's image holds the left column (sticky
 * on desktop, a banner on phones) while the rayons file past on the right
 * — numeral, name, honest count, one line of promise, the way in.
 */
export function VisageRayons({
  rayons,
  image,
  name,
  copy,
}: {
  rayons: CineRayon[];
  image: string | null;
  name: string;
  copy: Copy;
}) {
  if (rayons.length === 0) return null;
  return (
    <section id="rayons" aria-label={fmt(copy.univers.seeCategories, { n: rayons.length })} className="scroll-mt-16 bg-night">
      <div className="container-wide grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 className="cine-title max-w-[16ch]">{fmt(copy.univers.seeCategories, { n: rayons.length })}</h2>
            {image && (
              <div className="relative mt-10 hidden aspect-[4/5] overflow-hidden lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
                <p aria-hidden className="absolute bottom-5 start-5 cine-kicker">
                  {name}
                </p>
              </div>
            )}
          </div>
        </div>

        <ul className="lg:col-span-7">
          {image && (
            <li aria-hidden className="relative mb-10 aspect-[16/9] overflow-hidden lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
            </li>
          )}
          {rayons.map((c, i) => (
            <li key={c.slug} className="border-t border-film-line last:border-b">
              <Link href={`/categorie/${c.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 sm:gap-7">
                <span className="cine-index w-8">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-[clamp(1.35rem,2.6vw,1.9rem)] font-light leading-tight text-alabaster transition-colors duration-500 group-hover:text-cinabre-3">
                      {c.name}
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-haze-2">
                      {c.count} réf{c.count !== 1 ? "s" : ""}
                    </span>
                  </span>
                  {c.description && (
                    <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-haze">{c.description}</span>
                  )}
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-film-line text-haze transition-all duration-500 group-hover:border-cinabre-3 group-hover:bg-cinabre-3 group-hover:text-night">
                  <ArrowRightIcon size={15} className="rtl-mirror" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
