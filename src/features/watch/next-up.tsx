import Link from "next/link";
import { relatedTo, getFilm, isSeries } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { archiveIndexOf } from "@/features/content/repository";

/**
 * The end credits never send you nowhere: the archive suggests where the
 * same current takes you next — never autoplay, always a way out to the
 * source and the record.
 */
export function EndNextUp({
  body,
  filmSlug,
  sourceUrl,
}: {
  body: string;
  filmSlug?: string;
  license: "pd" | "cc-by";
  sourceUrl: string;
}) {
  const film = filmSlug ? getFilm(filmSlug) : undefined;
  const related = film ? relatedTo(film, 3) : [];
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <p className="text-sm text-ash">{body}</p>
      {related.length > 0 && (
        <div className="w-full">
          <p className="label-ar mb-3 text-center text-faint">من نفس التيار</p>
          <div className="flex justify-center gap-3">
            {related.map((t) => {
              const plate = plateForTitle(t, archiveIndexOf(t.slug));
              const href = isSeries(t) ? `/series/${t.slug}` : `/films/${t.slug}`;
              return (
                <Link key={t.slug} href={href} className="group/nu w-32 overflow-hidden rounded-frame border border-rule transition-colors hover:border-tungsten/60 sm:w-40">
                  <TitleArt plate={plate} variant="poster" className="block w-full transition-transform duration-(--duration-scene) group-hover/nu:scale-105" />
                  <p className="display-tight truncate border-t border-rule px-2 py-1.5 text-[12px] font-bold text-bone">{t.titleAr}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <Link href={sourceUrl} className="label-ar text-tungsten underline decoration-tungsten/40 underline-offset-4 hover:decoration-tungsten" target="_blank" rel="noreferrer">
        بطاقة المصدر على الأرشيف ←
      </Link>
    </div>
  );
}
