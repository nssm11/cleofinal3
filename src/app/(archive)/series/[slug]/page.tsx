import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allEpisodes, archiveIndexOf, getSeries, repo } from "@/features/content/repository";
import { GENRES } from "@/data/types";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { PlayBadge, ButtonLink } from "@/components/ui/button";
import { LicenseBadge } from "@/components/ui/chip";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { SubHead } from "@/components/ui/section-head";
import { ProgressClientRow } from "@/features/watch/episode-row";

export function generateStaticParams() {
  return repo.seriesList.map((s) => ({ slug: s.slug }));
}

/** The catalog is finite and fully known: unknown slugs are router-level 404s. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) return {};
  return { title: `${series.titleAr} (${series.yearFrom})`, description: series.synopsisAr.slice(0, 150) };
}

/**
 * The series page's job: seasons and episodes, stated plainly. Where the
 * archive documents an episode number we print it; otherwise the episode
 * stands on its title alone — no invented ordering.
 */
export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) notFound();

  const plate = plateForTitle(series, archiveIndexOf(series.slug));
  const first = allEpisodes(series)[0];
  const epCount = allEpisodes(series).length;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-4 pt-10 md:px-8">
      <nav aria-label="المسار" className="label-ar mb-8 flex items-center gap-2 text-faint">
        <Link href="/" className="transition-colors hover:text-bone">البرنامج</Link>
        <span>←</span>
        <Link href="/series" className="transition-colors hover:text-bone">مسلسلات</Link>
        <span>←</span>
        <span className="text-bone">{series.titleAr}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div>
          <p className="label-ar text-tungsten">مسلسل محفوظ · {series.yearFrom}–{series.yearTo}</p>
          <h1 className="display-tight mt-3 text-4xl font-bold sm:text-5xl">{series.titleAr}</h1>
          <p className="font-latin mt-2 text-lg italic text-ash">{series.titleLat}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href={`/watch/series/${series.slug}/${first.episode.slug}`} variant="primary-lg" className="group">
              <PlayBadge label={`ابدأ من ${first.episode.titleAr}`} />
            </ButtonLink>
            <WatchlistButton entry={{ key: series.slug, kind: "series", slug: series.slug }} labeled className="h-13 border-rule bg-transparent px-5 text-bone" />
          </div>

          <p className="mt-8 max-w-2xl text-[15px] leading-8 text-bone/90">{series.synopsisAr}</p>
          {series.noteAr && (
            <figure className="mt-6 max-w-2xl border-s-2 border-tungsten/60 ps-4">
              <figcaption className="label-ar mb-1 text-faint">ملاحظة البرنامج</figcaption>
              <blockquote className="text-[15px] leading-8 text-ash">{series.noteAr}</blockquote>
            </figure>
          )}

          <dl className="mt-8 grid max-w-xl gap-x-8 text-sm sm:grid-cols-2">
            {[
              ["التقديم والإنتاج", series.creatorAr],
              ["عدد الحلقات المحفوظة", `${epCount} حلقة`],
              ["التصنيفات", series.genres.map((g) => GENRES[g]).join("، ")],
              ["البلد", series.countryAr],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule-soft py-2.5 first:border-t first:border-rule sm:first:border-t-0">
                <dt className="label-ar text-faint">{k}</dt>
                <dd className="text-end text-bone">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <div className="lg:sticky lg:top-24">
            <TitleArt plate={plate} variant="wide" className="block w-full rounded-frame border border-rule" />
            <div className="mt-3 flex items-center justify-between">
              <LicenseBadge license={series.license} />
              <span className="label-mono text-faint" dir="ltr">№{String(archiveIndexOf(series.slug)).padStart(3, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* seasons & episodes */}
      <section aria-labelledby="episodes" className="mt-14">
        <SubHead titleAr="الحلقات" extra="حسب ما وثّقه الأرشيف" />
        <div className="space-y-10">
          {series.seasons.map((season, si) => (
            <div key={si}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                <h3 className="display-tight text-xl font-bold">
                  {season.n ? `الموسم ${["الأول","الثاني","الثالث","الرابع"][season.n-1] ?? season.n}` : season.labelAr}
                </h3>
                {season.noteAr && <p className="label-ar text-faint">{season.noteAr}</p>}
              </div>
              <ol className="list-none">
                {season.episodes.map((ep, i) => (
                  <ProgressClientRow
                    key={ep.slug}
                    series={series}
                    seasonIndex={si}
                    episodeIndex={i}
                  />
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
