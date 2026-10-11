"use client";

import Link from "next/link";
import type { Title } from "@/data/types";
import { GENRES, isSeries } from "@/data/types";
import { archiveIndexOf } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { resumable, useProgress } from "@/features/player/progress";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { cn } from "@/lib/cn";

/**
 * The title card. The plate IS the poster — information is quiet on the
 * frame and only speaks on hover: one line of who/what, play affordance,
 * save control. If you were watching, a tungsten thread marks how far.
 */

export function detailHref(title: Title): string {
  return isSeries(title) ? `/series/${title.slug}` : `/films/${title.slug}`;
}

export function TitleCard({ title, className }: { title: Title; className?: string }) {
  const plate = plateForTitle(title, archiveIndexOf(title.slug));
  const progressKey = title.slug;
  return (
    <article className={cn("group/card relative", className)}>
      <Link
        href={detailHref(title)}
        className="block overflow-hidden rounded-frame border border-rule/80 bg-coal transition-[border-color,transform] duration-(--duration-slide) ease-(--ease-projector) group-hover/card:-translate-y-0.5 group-hover/card:border-tungsten/50"
      >
        <div className="relative">
          <TitleArt plate={plate} variant="poster" className="block w-full transition-transform duration-(--duration-scene) ease-(--ease-projector) group-hover/card:scale-[1.03]" />
          {/* hover veil — a bottom bar of info, never a gradient over the whole art */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full border-t border-tungsten/20 bg-night/92 px-3 py-2.5 text-[12px] leading-5 text-bone transition-transform duration-(--duration-slide) ease-(--ease-projector) group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0">
            <span className="line-clamp-1">
              {isSeries(title) ? title.creatorAr : title.directorAr}
              <span className="text-faint"> · </span>
              {title.genres.slice(0, 2).map((g) => GENRES[g]).join("، ")}
            </span>
            <span className="label-ar mt-0.5 block text-tungsten">شاهد الآن ←</span>
          </div>
          <ProgressThread slug={progressKey} />
        </div>
      </Link>
      <WatchlistButton
        entry={{ key: title.slug, kind: title.kind, slug: title.slug }}
        className="absolute end-2 top-2 opacity-0 focus-visible:opacity-100 group-hover/card:opacity-100 motion-reduce:opacity-100"
      />
    </article>
  );
}

function ProgressThread({ slug }: { slug: string }) {
  const entry = useProgress(slug);
  const at = resumable(entry);
  if (at == null || !entry?.dur) return null;
  const pct = Math.min(100, Math.round((at / entry.dur) * 100));
  return (
    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-night/70" aria-hidden>
      <div className="h-full bg-tungsten" style={{ width: `${pct}%` }} />
    </div>
  );
}


/** Simple responsive grid — the workhorse for shelves. */
export function TitleGrid({ items, cols = 4, className }: { items: Title[]; cols?: 3 | 4 | 5; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:gap-5",
        cols === 3 && "md:grid-cols-3",
        cols === 4 && "md:grid-cols-3 lg:grid-cols-4",
        cols === 5 && "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {items.map((t) => (
        <TitleCard key={t.slug} title={t} />
      ))}
    </div>
  );
}
