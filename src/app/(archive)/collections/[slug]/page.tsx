import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { collectionFilms, getCollection, repo } from "@/features/content/repository";
import { TitleRail } from "@/features/catalog/rail";
import { CollectionShelfBody } from "@/features/catalog/layouts";

export function generateStaticParams() {
  return repo.collections.map((c) => ({ slug: c.slug }));
}

/** The catalog is finite and fully known: unknown slugs are router-level 404s. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return {};
  return { title: c.titleAr, description: c.essayAr.slice(0, 155) };
}

/**
 * A collection page is the program booklet for that programme: the essay
 * printed large, then the shelf itself composed exactly the way the
 * curator programmed it — the layout is the argument.
 */
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();
  const items = collectionFilms(c);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <nav aria-label="المسار" className="label-ar mb-8 flex items-center gap-2 text-faint">
        <Link href="/collections" className="transition-colors hover:text-bone">مجموعات</Link>
        <span>←</span>
        <span className="text-bone">{c.titleAr}</span>
      </nav>

      <header className="mb-12 grid gap-8 border-b border-rule pb-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="label-ar text-tungsten">برنامج منسّق · {items.length} أفلام</p>
          <h1 className="display-tight mt-3 text-4xl font-bold sm:text-5xl lg:text-6xl">{c.titleAr}</h1>
          <p className="font-latin mt-2 text-xl italic text-ash">{c.titleLat}</p>
        </div>
        <p className="max-w-2xl text-[15px] leading-9 text-bone/90 lg:pt-10">{c.essayAr}</p>
      </header>

      {c.layout === "rail" ? (
        <TitleRail items={items} />
      ) : (
        <CollectionShelfBody collection={c} items={items} />
      )}

      <div className="rule-double mt-16 mb-6" />
      <p className="label-ar text-faint">
        تُعرض الأفلام هنا كما برمجها الأرشيفي — وللفهرس الكامل بحرية الفلترة،{" "}
        <Link href="/films" className="text-tungsten underline underline-offset-4">تصفّح كل الأفلام</Link>.
      </p>
    </div>
  );
}
