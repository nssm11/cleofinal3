import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilm, repo } from "@/features/content/repository";
import { GENRES } from "@/data/types";
import { Player } from "@/features/player/player";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { LicenseBadge } from "@/components/ui/chip";
import { EndNextUp } from "@/features/watch/next-up";

export function generateStaticParams() {
  // The whole shelf is tiny and finite: pre-render every title.
  return repo.films.map((f) => ({ slug: f.slug }));
}

/** The catalog is finite and fully known: unknown slugs are router-level 404s. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) return { title: "غير موجود" };
  return {
    title: `مشاهدة ${film.titleAr}`,
    description: film.synopsisAr,
    robots: { index: false },
  };
}

export default async function WatchFilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top rail — the only chrome in the room */}
      <header className="flex items-center gap-4 border-b border-rule/70 bg-night px-4 py-3 md:px-6">
        <Link href={`/films/${film.slug}`} className="label-ar inline-flex items-center gap-1.5 text-ash transition-colors hover:text-bone">
          <span aria-hidden>←</span> بطاقة الفيلم
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="display-tight truncate text-sm font-bold sm:text-base">{film.titleAr}</p>
        </div>
        <WatchlistButton entry={{ key: film.slug, kind: "film", slug: film.slug }} className="border-rule bg-night" />
      </header>

      <div className="flex flex-1 flex-col">
        <div className="w-full bg-black">
          <div className="mx-auto max-w-[1500px]">
            <Player
              playKey={film.slug}
              identifier={film.source.identifier}
              fileHint={film.source.fileHint}
              title={film.titleAr}
              endOverlay={
                <EndNextUp
                  body={`${film.titleAr} — ${film.year} · ${film.directorAr}`}
                  filmSlug={film.slug}
                  license={film.license}
                  sourceUrl={film.source.pageUrl}
                />
              }
            />
          </div>
        </div>

        {/* the program notes, under the screen */}
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="display-tight text-2xl font-bold sm:text-3xl">
                {film.titleAr}
                <span className="font-latin ms-3 align-middle text-base font-normal italic text-ash">{film.titleLat}</span>
              </h1>
              <p className="nums label-ar mt-2 text-ash">
                {film.year} · {film.runtimeMin} دقيقة · {film.countryAr} · {film.genres.map((g) => GENRES[g]).join("، ")}
                {film.silent && " · صامت"}
              </p>
            </div>
            <LicenseBadge license={film.license} className="mt-1" />
          </div>
          {film.noteAr && (
            <figure className="mt-5 max-w-2xl border-s-2 border-tungsten/60 ps-4">
              <blockquote className="text-sm leading-7 text-ash">{film.noteAr}</blockquote>
            </figure>
          )}
          <p className="label-ar mt-6 max-w-3xl text-[12px] leading-6 text-faint">
            يُدار هذا العرض من نسخة الأرشيف العامة —{" "}
            <a href={film.source.pageUrl} target="_blank" rel="noreferrer" className="text-ash underline decoration-rule underline-offset-4 hover:text-tungsten">
              صفحة المصدر على Internet Archive
            </a>
            {film.attribution ? ` · ${film.attribution}` : " · العمل في الملكية العامة"}
          </p>
        </div>
      </div>
    </div>
  );
}
