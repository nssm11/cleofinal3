import Link from "next/link";
import type { Metadata } from "next";
import { collectionFilms, repo } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { archiveIndexOf } from "@/features/content/repository";
import { LAYOUT_HINT } from "@/components/ui/section-head";

export const metadata: Metadata = {
  title: "مجموعات",
  description: "برامج خيال المنسّقة: كل مجموعة رؤية، لا خانة تصفية.",
};

/**
 * Collections are the curator's desk on display — index page prints them as
 * a table of programs with their first plate as a marginal thumbnail.
 */
export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <header className="mb-8 border-b border-rule pb-6">
        <p className="label-ar text-tungsten">طاولات التنسيق</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-tight text-4xl font-bold sm:text-5xl">مجموعات</h1>
          <p className="label-ar text-ash">{repo.collections.length} برامج · مرتبة كما تُقرأ</p>
        </div>
      </header>

      <ol className="list-none border-t border-rule">
        {repo.collections.map((c, i) => {
          const members = collectionFilms(c);
          const first = members[0];
          const plate = first ? plateForTitle(first, archiveIndexOf(first.slug)) : null;
          return (
            <li key={c.slug} className="group/c border-b border-rule-soft">
              <Link href={`/collections/${c.slug}`} className="flex items-center gap-6 px-2 py-5 transition-colors hover:bg-coal sm:px-4">
                <span className="label-mono w-8 shrink-0 text-tungsten">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="display-tight text-2xl font-bold transition-colors group-hover/c:text-tungsten sm:text-3xl">
                    {c.titleAr}
                    <span className="font-latin ms-3 text-sm font-normal italic text-ash">{c.titleLat}</span>
                  </h2>
                  <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-6 text-ash">{c.essayAr}</p>
                  <p className="nums label-ar mt-1.5 text-faint">{members.length} أفلام · {LAYOUT_HINT[c.layout]}</p>
                </div>
                {plate && (
                  <div className="hidden w-32 shrink-0 overflow-hidden rounded-[3px] border border-rule transition duration-(--duration-slide) group-hover/c:border-tungsten/50 md:block lg:w-40">
                    <TitleArt plate={plate} variant="wide" className="block w-full" />
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
