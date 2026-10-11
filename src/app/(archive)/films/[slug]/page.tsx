import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { archiveIndexOf, getFilm, relatedTo, repo } from "@/features/content/repository";
import { GENRES } from "@/data/types";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { PlayBadge, ButtonLink } from "@/components/ui/button";
import { LicenseBadge, Chip } from "@/components/ui/chip";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { TitleGrid } from "@/features/catalog/title-card";

export function generateStaticParams() {
  return repo.films.map((f) => ({ slug: f.slug }));
}

/** The catalog is finite and fully known: unknown slugs are router-level 404s. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) return {};
  return {
    title: `${film.titleAr} (${film.year})`,
    description: `${film.synopsisAr.slice(0, 140)}…`,
  };
}

function MetaRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-b border-rule-soft py-2.5 text-sm first:border-t first:border-rule">
      <dt className="label-ar text-faint">{k}</dt>
      <dd className="text-bone">{children}</dd>
    </div>
  );
}

export default async function FilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) notFound();

  const plate = plateForTitle(film, archiveIndexOf(film.slug));
  const related = relatedTo(film, 5);
  const memberOf = repo.collections.filter((c) => c.members.includes(film.slug));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-4 pt-10 md:px-8">
      {/* breadcrumb — the program line */}
      <nav aria-label="المسار" className="label-ar mb-8 flex items-center gap-2 text-faint">
        <Link href="/" className="transition-colors hover:text-bone">البرنامج</Link>
        <span>←</span>
        <Link href="/films" className="transition-colors hover:text-bone">أفلام</Link>
        <span>←</span>
        <span className="text-bone">{film.titleAr}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
        {/* the plate, treated as an object */}
        <div>
          <div className="sticky top-24">
            <div className="group/plate relative">
              <TitleArt plate={plate} variant="poster" className="block w-full rounded-frame border border-rule transition-transform duration-(--duration-scene) ease-(--ease-projector) group-hover/plate:scale-[1.01]" />
              <div className="mt-3 flex items-center justify-between">
                <LicenseBadge license={film.license} />
                <span className="label-mono text-faint" dir="ltr">№{String(archiveIndexOf(film.slug)).padStart(3, "0")}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="label-ar text-tungsten">
            {film.year <= 1929 ? "من عصر الظلال" : film.license === "cc-by" ? "من الورشة المفتوحة" : "بطاقة فيلم"}
          </p>
          <h1 className="display-tight mt-3 text-4xl font-bold sm:text-5xl">{film.titleAr}</h1>
          <p className="font-latin mt-2 text-lg italic text-ash">
            {film.titleLat}
            {film.titleOriginal && <span className="text-faint"> · {film.titleOriginal}</span>}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href={`/watch/films/${film.slug}`} variant="primary-lg" className="group">
              <PlayBadge label="شاهد الآن — مجانًا" />
            </ButtonLink>
            <WatchlistButton entry={{ key: film.slug, kind: "film", slug: film.slug }} labeled className="h-13 border-rule bg-transparent px-5 text-bone" />
          </div>

          <p className="mt-8 max-w-2xl text-[15px] leading-8 text-bone/90">{film.synopsisAr}</p>

          {film.noteAr && (
            <figure className="mt-6 max-w-2xl border-s-2 border-tungsten/60 ps-4">
              <figcaption className="label-ar mb-1 text-faint">ملاحظة البرنامج</figcaption>
              <blockquote className="text-[15px] leading-8 text-ash">{film.noteAr}</blockquote>
            </figure>
          )}

          {/* facts table — archive-grade, hairline-quiet */}
          <dl className="mt-8 max-w-xl">
            <MetaRow k="الإخراج">{film.directorAr} <span className="text-faint">({film.directorLat})</span></MetaRow>
            {film.castAr && <MetaRow k="بطولة">{film.castAr.join("، ")}</MetaRow>}
            <MetaRow k="السنة">{film.year}</MetaRow>
            <MetaRow k="المدة">{film.runtimeMin} دقيقة</MetaRow>
            <MetaRow k="البلد">{film.countryAr} <span className="text-faint">({film.countryLat})</span></MetaRow>
            <MetaRow k="التصنيفات">
              <span className="flex flex-wrap gap-1.5">
                {film.genres.map((g) => (
                  <Link key={g} href={`/films?genre=${g}`} className="label-ar rounded-frame border border-rule px-2 py-0.5 text-ash transition-colors hover:border-tungsten/50 hover:text-tungsten">
                    {GENRES[g]}
                  </Link>
                ))}
              </span>
            </MetaRow>
            <MetaRow k="اللغة">{film.silent ? "صامت — بلا حوار منطوق" : "الحوار الأصلي (إنجليزية)"}</MetaRow>
            <MetaRow k="الترخيص">{film.license === "pd" ? "ملكية عامة — العرض قانوني بالكامل" : "CC BY 4.0 — مع الإسناد إلى Blender Foundation"}</MetaRow>
            <MetaRow k="المشغّل">
              <a href={film.source.pageUrl} target="_blank" rel="noreferrer" className="text-ash underline decoration-rule underline-offset-4 transition-colors hover:text-tungsten">
                نسخة Internet Archive ({film.source.identifier})
              </a>
            </MetaRow>
          </dl>

          {memberOf.length > 0 && (
            <div className="mt-8">
              <p className="label-ar mb-2 text-faint">ضمن برامج الأرشيف</p>
              <div className="flex flex-wrap gap-2">
                {memberOf.map((c) => (
                  <Chip key={c.slug} href={`/collections/${c.slug}`} className="h-9">
                    {c.titleAr}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-20">
          <div className="mb-6 flex items-baseline justify-between border-b border-rule pb-3">
            <h2 id="related" className="display-tight text-2xl font-bold">يعرض أيضًا في الصالة</h2>
            <Link href="/films" className="label-ar text-ash hover:text-tungsten">تصفح كل الأفلام ←</Link>
          </div>
          <TitleGrid items={related} cols={5} />
        </section>
      )}
    </div>
  );
}
