import Link from "next/link";
import type { Metadata } from "next";
import { collectionFilms, homeCollections, repo } from "@/features/content/repository";
import { SectionHead } from "@/components/ui/section-head";
import { CollectionShelfBody } from "@/features/catalog/layouts";
import { TitleGrid } from "@/features/catalog/title-card";
import { TonightProgram } from "@/features/home/tonight";
import { ContinueWatching } from "@/features/home/continue-watching";
import { ArabScreenPanel, StatsStrip } from "@/features/home/panels";
import { site } from "@/data/site";

export const metadata: Metadata = {
  description: site.descriptionAr,
};

/**
 * The homepage is tonight's program: a show card, then shelves — each one
 * composed for its content (strip, salon, index, wall, wide, feature) —
 * then the numbers, the serial shelf, and the work in progress.
 */
export default function HomePage() {
  const shelves = homeCollections();

  return (
    <>
      <TonightProgram />
      <ContinueWatching />

      <div className="mx-auto max-w-[1180px] px-4 md:px-8">
        {shelves.map((c, i) => {
          const items = collectionFilms(c);
          return (
            <section key={c.slug} aria-labelledby={`shelf-${c.slug}`} className="pt-16">
              <SectionHead
                index={i + 1}
                titleAr={c.titleAr}
                titleLat={c.titleLat}
                href={`/collections/${c.slug}`}
                hrefLabel={`كل ${c.titleAr}`}
              />
              <CollectionShelfBody collection={c} items={items} />
            </section>
          );
        })}

        <section aria-labelledby="shelf-series" className="pt-16">
          <SectionHead
            index={shelves.length + 1}
            titleAr="على الشاشة الصغيرة"
            titleLat="From the Small Screen"
            href="/series"
            hrefLabel="كل المسلسلات"
            note="عروض تلفزيونية من زمنٍ كان فيه كل شيء يُصنع أسرع وأصدق: حلقات مرقّمة حيث وثّقها الأرشيف، ومحفوظة حيث لم يُوثق."
          />
          <TitleGrid items={repo.seriesList} cols={3} />
        </section>
      </div>

      <div className="mt-16">
        <StatsStrip />
      </div>

      <div className="mx-auto max-w-[1180px] px-4 md:px-8">
        <ArabScreenPanel />
      </div>
    </>
  );
}
