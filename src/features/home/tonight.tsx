import Link from "next/link";
import { archiveIndexOf, todaysProgram } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { GENRES } from "@/data/types";
import { PlayBadge, ButtonLink } from "@/components/ui/button";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { LicenseBadge } from "@/components/ui/chip";

/**
 * Tonight's program — the front page of a cinematheque, not a banner.
 * A deterministic daily pick printed like a show card: the plate stands
 * tall beside the billing, the note is the curator's, and everything on
 * this section can actually be clicked and actually plays.
 */
export function TonightProgram() {
  const { featured, next } = todaysProgram();
  const plate = plateForTitle(featured, archiveIndexOf(featured.slug));
  const dateLine = new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <section aria-labelledby="tonight-title" className="relative overflow-hidden border-b border-rule">
      {/* the projection-room light; grain rides above everything dark */}
      <div className="light-cone absolute inset-0 -z-10" aria-hidden />
      <div className="grain-layer pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-screen" aria-hidden />
      <div className="grain absolute inset-y-0 hidden w-5 sprockets md:block" aria-hidden />

      <div className="mx-auto max-w-[1180px] px-4 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
          <p className="label-ar text-tungsten">
            برنامج الليلة <span className="mx-2 text-rule">/</span>{" "}
            <span className="text-ash">{dateLine}</span>
          </p>
          <p className="label-mono text-faint" dir="ltr">
            FREE · LEGAL · NO SIGN-UP
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <div>
            <p className="label-ar text-ash">يعرض الليلة على خيال</p>
            <h1 id="tonight-title" className="display-tight mt-3 text-[40px] leading-[1.15] font-bold text-bone sm:text-5xl lg:text-[64px]">
              {featured.titleAr}
            </h1>
            <p className="font-latin mt-3 text-lg italic text-ash sm:text-xl">
              {featured.titleOriginal ?? featured.titleLat} · {featured.year}
            </p>

            <p className="nums label-ar mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-bone">
              <span>{featured.runtimeMin} دقيقة</span>
              <span className="text-rule">|</span>
              <span>{featured.countryAr}</span>
              <span className="text-rule">|</span>
              <span>{featured.directorAr}</span>
              <span className="text-rule">|</span>
              <span>{featured.genres.map((g) => GENRES[g]).join("، ")}</span>
            </p>

            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-bone/90 sm:text-base sm:leading-9">
              {featured.synopsisAr}
            </p>

            {featured.noteAr && (
              <figure className="mt-7 max-w-2xl border-s-2 border-tungsten/70 ps-4">
                <blockquote className="text-sm leading-7 text-ash">
                  ملاحظة البرنامج — {featured.noteAr}
                </blockquote>
              </figure>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/watch/films/${featured.slug}`} variant="primary-lg" className="group">
                <PlayBadge label="شاهد العرض الكامل" />
              </ButtonLink>
              <WatchlistButton
                entry={{ key: featured.slug, kind: "film", slug: featured.slug }}
                labeled
                className="h-13 border-rule bg-transparent px-5 text-bone"
              />
              <Link href={`/films/${featured.slug}`} className="ms-1 text-sm text-ash underline decoration-rule underline-offset-6 transition-colors hover:text-bone">
                بطاقة الفيلم
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[340px] lg:mx-0 lg:w-[360px]">
            <div className="absolute -inset-8 -z-10 rounded-full bg-tungsten/10 blur-3xl" aria-hidden />
            <TitleArt plate={plate} variant="poster" className="block w-full rounded-frame border border-rule shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]" />
            <div className="mt-3 flex items-center justify-between">
              <LicenseBadge license={featured.license} />
              <span className="label-mono text-faint" dir="ltr">
                №{String(archiveIndexOf(featured.slug)).padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* the rest of tonight's bill — two smaller slots */}
        <div className="rule-double mt-14 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {next.map((f, i) => {
            const p = plateForTitle(f, archiveIndexOf(f.slug));
            return (
              <Link key={f.slug} href={`/films/${f.slug}`} className="group/bill flex items-center gap-4 rounded-frame border border-rule/70 bg-coal/60 p-3 transition-colors hover:border-tungsten/40 hover:bg-coal">
                <div className="w-24 shrink-0 overflow-hidden rounded-[2px] border border-rule">
                  <TitleArt plate={p} variant="wide" className="block w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="label-ar text-faint">{i === 0 ? "تبعًا" : "وفي الفاصل"}</p>
                  <h2 className="display-tight mt-0.5 truncate text-lg font-bold transition-colors group-hover/bill:text-tungsten">
                    {f.titleAr}
                  </h2>
                  <p className="nums label-ar mt-0.5 truncate text-ash">{f.year} · {f.runtimeMin} دقيقة · {GENRES[f.genres[0]]}</p>
                </div>
                <span className="label-mono me-2 hidden text-tungsten opacity-0 transition-opacity group-hover/bill:opacity-100 sm:block">▶ PLAY</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
