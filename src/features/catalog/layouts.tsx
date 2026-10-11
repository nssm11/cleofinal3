import Link from "next/link";
import { GENRES, isSeries, type Collection, type Film, type Title } from "@/data/types";
import { archiveIndexOf } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { TitleCard } from "./title-card";
import { TitleRail } from "./rail";
import { cn } from "@/lib/cn";

/**
 * The shelf compositions — one grammar, many postures. A collection decides
 * how it is displayed; the components make sure every way of hanging the
 * same plates still reads as the same archive.
 */

export function IndexRows({ items }: { items: Film[] }) {
  return (
    <ol className="list-none border-t border-rule">
      {items.map((f, i) => {
        const plate = plateForTitle(f, archiveIndexOf(f.slug));
        return (
          <li key={f.slug} className="group/row relative border-b border-rule-soft">
            <Link href={`/films/${f.slug}`} className="flex items-center gap-4 px-2 py-4 transition-colors duration-(--duration-flip) hover:bg-coal sm:gap-6 sm:px-3">
              <span className="label-mono w-8 shrink-0 text-tungsten/90">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="display-tight text-lg font-bold text-bone transition-colors group-hover/row:text-tungsten sm:text-2xl">
                  {f.titleAr}
                  <span className="font-latin ms-3 hidden text-sm font-normal italic text-ash sm:inline">
                    {f.titleLat}
                  </span>
                </h3>
                <p className="label-ar mt-1 truncate text-faint">
                  {f.directorAr} <span className="text-rule">|</span> {f.year} <span className="text-rule">|</span> {f.runtimeMin} دقيقة
                  {f.silent && <span className="text-ash"> · صامت</span>}
                  <span className="hidden md:inline"> <span className="text-rule">|</span> {GENRES[f.genres[0]]}</span>
                </p>
              </div>
              <div className="w-10 shrink-0 opacity-60 grayscale transition duration-(--duration-slide) group-hover/row:opacity-100 group-hover/row:grayscale-0 sm:w-14">
                <TitleArt plate={plate} variant="micro" className="block w-full rounded-[2px] border border-rule/60" />
              </div>
              <span className="label-ar hidden shrink-0 ps-1 text-ash opacity-0 transition-opacity group-hover/row:opacity-100 lg:block">
                شاهد ←
              </span>
            </Link>
            <WatchlistButton
              entry={{ key: f.slug, kind: "film", slug: f.slug }}
              className="absolute -top-px start-1 opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100 motion-reduce:opacity-100 sm:start-auto sm:end-1"
            />
          </li>
        );
      })}
    </ol>
  );
}

/** Museum hang: alternating vertical offsets, generous air, captions below. */
export function SalonWall({ items }: { items: Film[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
      {items.map((f, i) => (
        <figure key={f.slug} className={cn("group/salon", i % 2 === 1 && "lg:translate-y-10", i === 2 && "md:translate-y-6 lg:translate-y-0")}>
          <TitleCard title={f} />
          <figcaption className="label-ar mt-3 px-0.5 text-faint">
            {f.year} · {GENRES[f.genres[0]]}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Contact sheet: tight cells, hairline gutters, minimal chrome. */
export function ContactWall({ items }: { items: Title[] }) {
  return (
    <div className="grid grid-cols-3 gap-px border border-rule bg-rule sm:grid-cols-4 lg:grid-cols-5">
      {items.map((t) => {
        const plate = plateForTitle(t, archiveIndexOf(t.slug));
        const href = isSeries(t) ? `/series/${t.slug}` : `/films/${t.slug}`;
        return (
          <Link key={t.slug} href={href} className="group/wall relative block overflow-hidden bg-night focus-visible:bg-coal">
            <TitleArt plate={plate} variant="poster" className="block w-full opacity-90 transition duration-(--duration-slide) ease-(--ease-projector) group-hover/wall:scale-[1.04] group-hover/wall:opacity-100" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-night/92 px-2 py-1.5 text-[11px] leading-4 text-tungsten transition-transform duration-(--duration-slide) ease-(--ease-projector) group-hover/wall:translate-y-0">
              {t.titleAr} ←
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Open-workshop posture: wide 16:9 plates, essay air, a play you can reach. */
export function WideRows({ items }: { items: Film[] }) {
  return (
    <ul className="grid list-none gap-5 lg:grid-cols-2">
      {items.map((f) => {
        const plate = plateForTitle(f, archiveIndexOf(f.slug));
        return (
          <li key={f.slug} className="group/wide relative flex flex-col overflow-hidden rounded-frame border border-rule/80 bg-coal transition-colors hover:border-tungsten/40 sm:flex-row">
            <Link href={`/films/${f.slug}`} className="block w-full sm:w-[56%]">
              <TitleArt plate={plate} variant="wide" className="block h-full w-full object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div>
                <h3 className="display-tight text-xl font-bold">
                  <Link href={`/films/${f.slug}`} className="transition-colors hover:text-tungsten">
                    {f.titleAr}
                  </Link>
                </h3>
                <p className="font-latin mt-1 text-[13px] italic text-ash">{f.titleLat} · {f.year}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-ash">{f.synopsisAr}</p>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/watch/films/${f.slug}`} className="label-ar inline-flex items-center gap-2 text-tungsten">
                  <span aria-hidden className="inline-block size-2 rounded-full bg-tungsten shadow-[0_0_12px_2px_rgba(232,163,61,0.35)]" />
                  شغّل الآن ({f.runtimeMin} د)
                </Link>
                <WatchlistButton entry={{ key: f.slug, kind: "film", slug: f.slug }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** One big work + the rest of the row as a list — for editorial shelves. */
export function FeatureBlock({ hero, rest }: { hero: Film; rest: Film[] }) {
  const plate = plateForTitle(hero, archiveIndexOf(hero.slug));
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="group/feat relative overflow-hidden rounded-frame border border-rule/80">
        <Link href={`/films/${hero.slug}`} aria-label={`${hero.titleAr} — الصفحة`}>
          <TitleArt plate={plate} variant="wide" className="block aspect-video w-full transition-transform duration-(--duration-reel) ease-(--ease-projector) group-hover/feat:scale-[1.015]" />
        </Link>
        <div className="pointer-events-none absolute inset-0 vignette" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-linear-to-t from-night/95 via-night/40 to-transparent p-5 pt-16">
          <div>
            <h3 className="display-tight text-2xl font-bold md:text-3xl">{hero.titleAr}</h3>
            <p className="font-latin mt-1 text-sm italic text-ash">{hero.titleLat} · {hero.year}</p>
          </div>
          <Link
            href={`/watch/films/${hero.slug}`}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-frame bg-tungsten px-4 text-sm font-semibold text-night transition hover:bg-ember"
          >
            <span aria-hidden>▶</span> شغّل
          </Link>
        </div>
      </div>
      <div>
        <p className="text-sm leading-7 text-ash">{hero.synopsisAr}</p>
        <ol className="mt-6 border-t border-rule">
          {rest.map((f, i) => (
            <li key={f.slug} className="border-b border-rule-soft">
              <Link href={`/films/${f.slug}`} className="group/mini flex items-baseline gap-4 py-3.5 transition-colors hover:bg-coal px-2">
                <span className="label-mono text-tungsten/90">{String(i + 2).padStart(2, "0")}</span>
                <span className="display-tight flex-1 truncate text-base font-bold transition-colors group-hover/mini:text-tungsten">{f.titleAr}</span>
                <span className="nums font-mono text-xs text-faint">{f.year} · {f.runtimeMin}د</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function CollectionShelfBody({ collection, items }: { collection: Collection; items: Film[] }) {
  switch (collection.layout) {
    case "index":
      return <IndexRows items={items} />;
    case "salon":
      return <SalonWall items={items} />;
    case "wall":
      return <ContactWall items={items} />;
    case "wide":
      return <WideRows items={items} />;
    case "feature":
      return <FeatureBlock hero={items[0]} rest={items.slice(1)} />;
    case "rail":
    default:
      return <RailShelf items={items} />;
  }
}

function RailShelf({ items }: { items: Film[] }) {
  return <TitleRail items={items} />;
}
