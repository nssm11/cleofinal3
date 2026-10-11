import type { Metadata } from "next";
import { allEpisodes, archiveIndexOf, getSeries, repo } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { GENRES } from "@/data/types";
import Link from "next/link";
import { LicenseBadge } from "@/components/ui/chip";

export const metadata: Metadata = {
  title: "مسلسلات",
  description: "مسلسلات التلفزة المبكرة الباقية في الملكية العامة، حلقةً حلقة — بحلقات مرقّمة حيث وثّقها الأرشيف.",
};

/**
 * Three series, presented as three billboards — no generic grid: each row
 * pairs the wide plate with the season/episode math up front, because the
 * promise of a series page is clarity on WHAT exists and can be played.
 */
export default function SeriesPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <header className="mb-10 border-b border-rule pb-6">
        <p className="label-ar text-tungsten">رفّ الحلقات</p>
        <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">مسلسلات</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ash">
          تلفزة الخمسينيات وبداية الستينيات: إنتاجات صُنعت لتُعرض مرةً ثم تُنسى، فبقيت في الملك العام
          لتُشاهد من جديد. الحلقات تُعرض بعددها حين يكون موثّقًا فقط — الأرشيف لا يخترق سجلات لم تصله.
        </p>
      </header>

      <div className="space-y-12">
        {repo.seriesList.map((s, i) => {
          const eps = allEpisodes(s);
          const plate = plateForTitle(s, archiveIndexOf(s.slug));
          return (
            <article key={s.slug} className="group/sr relative grid items-stretch gap-6 overflow-hidden rounded-frame border border-rule/80 bg-coal transition-colors hover:border-tungsten/40 md:grid-cols-[1fr_300px]">
              <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="label-mono text-tungsten">S{i + 1}</span>
                    <LicenseBadge license={s.license} />
                  </div>
                  <h2 className="display-tight mt-4 text-3xl font-bold sm:text-4xl">
                    <Link href={`/series/${s.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-tungsten transition-colors">
                      {s.titleAr}
                    </Link>
                  </h2>
                  <p className="font-latin mt-1 text-base italic text-ash">{s.titleLat} · {s.yearFrom}–{s.yearTo}</p>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-bone/85">{s.synopsisAr}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="nums label-ar text-ash">{s.seasons.length} موسمًا · {eps.length} حلقات محفوظة</span>
                  <span className="text-rule">|</span>
                  <span className="label-ar text-faint">{s.genres.map((g) => GENRES[g]).join("، ")}</span>
                </div>
              </div>
              <div className="order-first md:order-last">
                <TitleArt plate={plate} variant="wide" className="h-full max-h-64 w-full object-cover md:max-h-none" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
