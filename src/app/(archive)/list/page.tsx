"use client";

import Link from "next/link";
import { useWatchlist, removeFromWatchlist, type WatchlistEntry } from "@/features/watchlist/store";
import { getFilm, getSeries, archiveIndexOf } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * قائمتي — the shelf the visitor assembled. Resolves the stored keys against
 * the live catalog each render (so a title retired from the archive would
 * vanish here too, honestly).
 */
export default function ListPage() {
  const stored = useWatchlist();

  const entries = stored
    .map((e) => ({ e, ...resolve(e) }))
    .filter((x): x is { e: WatchlistEntry; href: string; titleAr: string; titleLat: string; sub: string; plate: NonNullable<typeof x.plate> } => Boolean(x.plate));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="label-ar text-tungsten">رفّك الخاص</p>
          <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">قائمتي</h1>
        </div>
        <p className="nums label-ar text-ash">{entries.length} محفوظ</p>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="القائمة تنتظر أول اختيار"
          body="احفظ فيلماً أو حلقة من أي بطاقة في الأرشيف — ستجدها هنا على هذا الجهاز، بلا حساب ولا بريد."
          action={<Link href="/films" className="label-ar border-b border-tungsten/50 pb-1 text-tungsten">تصفّح الأفلام ←</Link>}
        />
      ) : (
        <ul className="grid list-none grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ e, href, titleAr, titleLat, sub, plate }) => (
            <li key={e.key} className="group/l relative">
              <Link href={href} className="block overflow-hidden rounded-frame border border-rule/80 transition-colors hover:border-tungsten/50">
                <TitleArt plate={plate} variant="poster" className="block w-full transition-transform duration-(--duration-scene) ease-(--ease-projector) group-hover/l:scale-[1.02]" />
                <div className="border-t border-rule bg-coal/90 px-3 py-2">
                  <p className="display-tight truncate text-sm font-bold">{titleAr}</p>
                  <p className="nums label-ar mt-0.5 truncate text-[11px] text-faint">{titleLat} · {sub}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => removeFromWatchlist(e.key)}
                aria-label={`إزالة ${titleAr} من القائمة`}
                className="absolute end-2 top-2 rounded-frame border border-rule bg-night/85 px-2 py-1 text-[11px] text-ash opacity-0 transition hover:border-cinnabar hover:text-cinnabar focus-visible:opacity-100 group-hover/l:opacity-100 motion-reduce:opacity-100"
              >
                إزالة
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function resolve(e: WatchlistEntry) {
  if (e.kind === "series" && e.episodeSlug) {
    const s = getSeries(e.slug);
    const ep = s?.seasons.flatMap((x) => x.episodes).find((x) => x.slug === e.episodeSlug);
    if (!s || !ep) return {};
    return {
      href: `/watch/series/${s.slug}/${ep.slug}`,
      titleAr: `${s.titleAr}: ${ep.titleAr}`,
      titleLat: ep.titleLat,
      sub: ep.numberLabel ?? `${ep.runtimeMin} د`,
      plate: plateForTitle(s, archiveIndexOf(s.slug)),
    };
  }
  if (e.kind === "series") {
    const s = getSeries(e.slug);
    if (!s) return {};
    return { href: `/series/${s.slug}`, titleAr: s.titleAr, titleLat: s.titleLat, sub: `${s.yearFrom}–${s.yearTo}`, plate: plateForTitle(s, archiveIndexOf(s.slug)) };
  }
  const f = getFilm(e.slug);
  if (!f) return {};
  return { href: `/films/${f.slug}`, titleAr: f.titleAr, titleLat: f.titleLat, sub: `${f.year} · ${f.runtimeMin} د`, plate: plateForTitle(f, archiveIndexOf(f.slug)) };
}
