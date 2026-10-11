import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allEpisodes, findEpisode, getSeries, neighbors, repo } from "@/features/content/repository";
import { GENRES } from "@/data/types";
import { Player } from "@/features/player/player";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return repo.seriesList.flatMap((s) =>
    allEpisodes(s).map((ref) => ({ slug: s.slug, episode: ref.episode.slug })),
  );
}

/** The catalog is finite and fully known: unknown slugs are router-level 404s. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; episode: string }> }): Promise<Metadata> {
  const { slug, episode } = await params;
  const ref = findEpisode(slug, episode);
  if (!ref) return { title: "غير موجود" };
  return {
    title: `${ref.series.titleAr} — ${ref.episode.titleAr}`,
    description: ref.series.synopsisAr,
    robots: { index: false },
  };
}

export default async function WatchEpisodePage({ params }: { params: Promise<{ slug: string; episode: string }> }) {
  const { slug, episode } = await params;
  const ref = findEpisode(slug, episode);
  if (!ref) notFound();
  const series = getSeries(slug)!;
  const { prev, next } = neighbors(ref);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-4 border-b border-rule/70 bg-night px-4 py-3 md:px-6">
        <Link href={`/series/${series.slug}`} className="label-ar inline-flex items-center gap-1.5 text-ash transition-colors hover:text-bone">
          <span aria-hidden>←</span> صفحة المسلسل
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="display-tight truncate text-sm font-bold sm:text-base">
            {series.titleAr}
            <span className="mx-2 text-faint">/</span>
            {ref.episode.numberLabel && <span className="nums font-mono text-ash">{ref.episode.numberLabel}</span>}
            {ref.episode.titleAr}
          </p>
        </div>
        <WatchlistButton
          entry={{ key: `${series.slug}/${ref.episode.slug}`, kind: "series", slug: series.slug, episodeSlug: ref.episode.slug }}
          className="border-rule bg-night"
        />
      </header>

      <div className="w-full bg-black">
        <div className="mx-auto max-w-[1500px]">
          <Player
            playKey={`${series.slug}/${ref.episode.slug}`}
            identifier={ref.episode.source.identifier}
            fileHint={ref.episode.source.fileHint}
            title={ref.episode.titleAr}
            endOverlay={
              next ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="label-ar text-ash">الحلقة التالية</p>
                  <Link href={`/watch/series/${series.slug}/${next.episode.slug}`} className="group/nx inline-flex items-center gap-3 rounded-frame border border-rule px-4 py-2 transition-colors hover:border-tungsten/60">
                    <span className="display-tight text-base font-bold group-hover/nx:text-tungsten">{next.episode.titleAr}</span>
                    <span className="label-mono text-faint" dir="ltr">▶</span>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-ash">وصلت إلى آخر ما حفظه الأرشيف من هذا الموسم.</p>
              )
            }
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="display-tight text-2xl font-bold">{ref.episode.titleAr}</h1>
            <p className="nums label-ar mt-1 text-ash">
              {series.titleAr} · {series.seasons[ref.seasonIndex]?.labelAr}
              {ref.episode.numberLabel ? ` · ${ref.episode.numberLabel}` : ""} · {ref.episode.runtimeMin} دقيقة
            </p>
          </div>
          <div className="flex gap-2">
            {prev && (
              <Link href={`/watch/series/${series.slug}/${prev.episode.slug}`} className="inline-flex h-10 items-center rounded-frame border border-rule px-4 text-sm text-ash transition-colors hover:border-tungsten/50 hover:text-bone">
                السابقة
              </Link>
            )}
            {next && (
              <Link href={`/watch/series/${series.slug}/${next.episode.slug}`} className="inline-flex h-10 items-center rounded-frame bg-tungsten px-4 text-sm font-semibold text-night transition-colors hover:bg-ember">
                التالية
              </Link>
            )}
          </div>
        </div>

        <p className="label-ar mt-6 text-[12px] leading-6 text-faint">
          مصدر الحلقة —{" "}
          <a href={ref.episode.source.pageUrl} target="_blank" rel="noreferrer" className="text-ash underline decoration-rule underline-offset-4 hover:text-tungsten">
            Internet Archive · {ref.episode.source.identifier}
          </a>
        </p>

        {/* episode switcher */}
        <ol className="mt-8 border-t border-rule">
          {allEpisodes(series).map((r, i) => (
            <li key={r.episode.slug} className={cn("border-b border-rule-soft", r.episode.slug === episode && "bg-coal")}>
              <Link href={`/watch/series/${series.slug}/${r.episode.slug}`} className="flex items-center gap-4 px-2 py-3 transition-colors hover:bg-coal/60">
                <span className="label-mono w-16 shrink-0 text-tungsten/90">{r.episode.numberLabel ?? String(i + 1).padStart(2, "0")}</span>
                <span className="display-tight flex-1 truncate text-sm font-bold">{r.episode.titleAr}</span>
                <span className="nums font-mono text-xs text-faint">{r.episode.year} · {r.episode.runtimeMin}د</span>
                {r.episode.slug === episode && <span className="label-ar text-tungsten">الآن</span>}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
