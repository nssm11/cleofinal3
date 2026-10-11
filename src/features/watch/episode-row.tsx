"use client";

import Link from "next/link";
import type { Series } from "@/data/types";
import { resumable, useProgress } from "@/features/player/progress";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { cn } from "@/lib/cn";

/**
 * One episode line in the ledger: number when documented, title always,
 * runtime, resume state when this device started it, direct play link.
 */
export function ProgressClientRow({
  series,
  seasonIndex,
  episodeIndex,
}: {
  series: Series;
  seasonIndex: number;
  episodeIndex: number;
}) {
  const season = series.seasons[seasonIndex];
  const ep = season.episodes[episodeIndex];
  const key = `${series.slug}/${ep.slug}`;
  const entry = useProgress(key);
  const at = resumable(entry);
  const pct = at != null && entry ? Math.min(100, Math.round((at / entry.dur) * 100)) : 0;

  return (
    <li className={cn("group/ep relative border-b border-rule-soft transition-colors hover:bg-coal/60", at != null && "bg-coal/35")}>
      <Link href={`/watch/series/${series.slug}/${ep.slug}`} className="flex items-center gap-4 px-2 py-3.5">
        <span className="label-mono w-20 shrink-0 text-tungsten/90">{ep.numberLabel ?? String(episodeIndex + 1).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="display-tight block truncate text-base font-bold transition-colors group-hover/ep:text-tungsten">
            {ep.titleAr}
            <span className="font-latin ms-3 hidden text-[13px] font-normal italic text-ash sm:inline">{ep.titleLat}</span>
          </span>
          {at != null && (
            <span className="mt-1.5 flex items-center gap-2">
              <span className="h-[3px] w-28 bg-rule">
                <span className="block h-full bg-tungsten" style={{ width: `${pct}%` }} />
              </span>
              <span className="label-ar text-[11px] text-ash">تُتابعها — من {Math.floor(at / 60)}:{String(Math.floor(at % 60)).padStart(2, "0")}</span>
            </span>
          )}
        </span>
        <span className="nums font-mono text-xs text-faint">{ep.runtimeMin} د</span>
        <span className="label-ar hidden text-[12px] text-ash opacity-0 transition-opacity group-hover/ep:opacity-100 md:block">شغّل ←</span>
      </Link>
      <WatchlistButton
        entry={{ key, kind: "series", slug: series.slug, episodeSlug: ep.slug }}
        className="absolute end-0 top-1/2 -translate-y-1/2 opacity-0 focus-visible:opacity-100 group-hover/ep:opacity-100 motion-reduce:opacity-100"
      />
    </li>
  );
}
