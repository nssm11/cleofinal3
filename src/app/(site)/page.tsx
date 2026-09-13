import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands } from "@/db/schema";
import { getFeatured, getNewArrivals, getPromoProducts, getUniverses, getConcerns } from "@/lib/catalog";
import { getCopy } from "@/lib/i18n/server";
import { EditorialHome } from "@/components/home/editorial-home";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parapharmacie en ligne premium — livraison partout en Tunisie",
  description:
    "Dermo-cosmétique, solaire, cheveux, bébé et compléments alimentaires : des produits authentiques, conseillés par nos pharmaciens à Ezzahra et Hammam-Lif, livrés en 24–72 h partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — Parapharmacie en ligne premium en Tunisie",
    description:
      "Des soins authentiques, sélectionnés et conseillés par nos pharmaciens. Livraison 24–72 h partout en Tunisie, offerte dès 99 DT.",
    url: "/",
  },
};

/**
 * The homepage is an editorial index rather than a stack of promotional
 * modules. All catalogue data is still live; only the composition is new.
 */
export default async function HomePage() {
  const [universes, featured, promos, brandRows, posts, concerns, copy, novelties] = await Promise.all([
    getUniverses(),
    getFeatured(8),
    getPromoProducts(6),
    db.select().from(brands).where(eq(brands.isFeatured, true)).orderBy(desc(brands.isFeatured)).limit(8),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(3),
    getConcerns(),
    getCopy(),
    getNewArrivals(8),
  ]);

  const t = copy.home;
  return (
    <EditorialHome
      universes={universes}
      featured={featured}
      newArrivals={novelties}
      promos={promos}
      concerns={concerns}
      posts={posts}
      brands={brandRows}
      copy={{
        hero: copy.hero,
        rayonsIndex: t.rayonsIndex,
        rayonsEyebrow: t.rayonsEyebrow,
        rayonsTitle: t.rayonsTitle,
        rayonsDesc: t.rayonsDesc,
        rayonsCta: t.rayonsCta,
        needsEyebrow: t.needsEyebrow,
        needsTitle1: t.needsTitle1,
        needsTitle2: t.needsTitle2,
        needsText: t.needsText,
        needsCta: t.needsCta,
        journalEyebrow: t.journalEyebrow,
        journalTitle: t.journalTitle,
        journalCta: t.journalCta,
        housesEyebrow: t.housesEyebrow,
        housesTitle: t.housesTitle,
        housesDesc: t.housesDesc,
        housesCta: t.housesCta,
      }}
      common={{ discover: copy.common.discover, viewAll: copy.common.viewAll, minutes: copy.common.minutes }}
    />
  );
}
