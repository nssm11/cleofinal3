"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { archiveIndexOf, getFilm, getSeries } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { clearProgress, resumable, useProgressMap } from "@/features/player/progress";

/**
 * Continue watching — genuinely observed, never faked: the strip appears
 * only when this device actually left a reel half-turned, and disappears
 * the moment there is nothing to resume.
 */

interface Row {
  playKey: string;
  titleAr: string;
  titleLat: string;
  href: string;
  plate: ReturnType<typeof plateForTitle>;
  pct: number;
  resumeAt: number;
}

export function ContinueWatching() {
  const map = useProgressMap();
  const rows: Row[] = [];

  for (const [key, entry] of Object.entries(map)) {
    const at = resumable(entry);
    if (at == null) continue;
    const parts = key.split("/");
    if (parts.length === 1) {
      const film = getFilm(parts[0]);
      if (!film) continue;
      rows.push({
        playKey: key,
        titleAr: film.titleAr,
        titleLat: film.titleLat,
        href: `/watch/films/${film.slug}`,
        plate: plateForTitle(film, archiveIndexOf(film.slug)),
        pct: Math.round((at / entry.dur) * 100),
        resumeAt: at,
      });
    } else {
      const series = getSeries(parts[0]);
      const ep = series?.seasons.flatMap((s) => s.episodes).find((e) => e.slug === parts[1]);
      if (!series || !ep) continue;
      rows.push({
        playKey: key,
        titleAr: `${series.titleAr}: ${ep.titleAr}`,
        titleLat: ep.titleLat,
        href: `/watch/series/${series.slug}/${ep.slug}`,
        plate: plateForTitle(series, archiveIndexOf(series.slug)),
        pct: Math.round((at / entry.dur) * 100),
        resumeAt: at,
      });
    }
  }

  if (rows.length === 0) return null;
  rows.sort((a, b) => b.resumeAt - a.resumeAt);

  return (
    <section aria-labelledby="continue-title" className="mx-auto max-w-[1180px] px-4 pt-12 md:px-8">
      <div className="mb-4 flex items-baseline justify-between border-b border-rule pb-2">
        <h2 id="continue-title" className="display-tight text-2xl font-bold">اتمتِع بما بدأت</h2>
        <span className="label-ar text-faint">محفوظ على هذا الجهاز</span>
      </div>
      <ul className="grid list-none gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.slice(0, 6).map((r) => (
          <li key={r.playKey} className="group/resume relative overflow-hidden rounded-frame border border-rule/70 bg-coal transition-colors hover:border-tungsten/40">
            <Link href={r.href} className="flex items-center gap-4 p-3">
              <div className="w-28 shrink-0 overflow-hidden rounded-[2px] border border-rule">
                <TitleArt plate={r.plate} variant="wide" className="block w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="display-tight truncate text-base font-bold transition-colors group-hover/resume:text-tungsten">{r.titleAr}</p>
                <p className="nums label-ar mt-1 text-ash">
                  توقفت عند {Math.floor(r.resumeAt / 60)}:{String(Math.floor(r.resumeAt % 60)).padStart(2, "0")}
                  <span className="text-faint"> · {r.pct}%</span>
                </p>
                <div className="mt-2 h-[3px] w-full bg-rule">
                  <div className="h-full bg-tungsten" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => clearProgress(r.playKey)}
              aria-label="إزالة من المتابَعة"
              className="absolute end-2 top-2 grid size-7 place-items-center rounded-frame border border-rule bg-night/80 text-faint opacity-0 transition hover:text-cinnabar group-hover/resume:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
