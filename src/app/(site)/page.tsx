import type { Metadata } from "next";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, categories, concerns, productConcerns, products, promotions, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured, getUniverses, publiclyVisible } from "@/lib/catalog";
import { getShelfForToday } from "@/lib/merch";
import { getCopy } from "@/lib/i18n/server";
import { Overture } from "@/components/coupe/overture";
import { Counter } from "@/components/coupe/counter";
import { Floors } from "@/components/coupe/floors";
import { Vitrine } from "@/components/coupe/vitrine";
import { Arrivages } from "@/components/coupe/arrivages";
import { Ordonnance } from "@/components/coupe/ordonnance";
import { Arcades } from "@/components/coupe/arcades";
import { Journal } from "@/components/coupe/journal";
import { Enseigne } from "@/components/coupe/enseigne";
import { getNewArrivals } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * CLÉOPÂTRE — « LA MAISON EN COUPE ».
 *
 * The homepage is drawn as an architectural section of the house: a façade,
 * a counter, the arcade of rayons, a lit vitrine below grade, the week's
 * arrivals on a stone line, the ledger of needs, the signage of the houses,
 * the journal plates, and the two real doors. Every register is populated by
 * the live catalogue — counts, prices, images, links — never by props.
 */
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

export default async function HomePage() {
  const [universes, featured, shelf, promoRows, newArrivals, brandRows, posts, storeRows, concernRows, [refsRow], concernCounts, copy, user] = await Promise.all([
    getUniverses(),
    getFeatured(12),
    getShelfForToday(),
    db.select().from(promotions).where(eq(promotions.isActive, true)).limit(3),
    getNewArrivals(6),
    db.select().from(brands).orderBy(asc(brands.name)),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(4),
    db.select().from(stores).where(eq(stores.isActive, true)),
    db.select().from(concerns).orderBy(asc(concerns.name)),
    db.select({ n: count() }).from(products).where(publiclyVisible),
    db
      .select({ id: concerns.id, n: sql<number>`count(*)::int` })
      .from(concerns)
      .innerJoin(productConcerns, eq(productConcerns.concernId, concerns.id))
      .innerJoin(products, and(eq(products.id, productConcerns.productId), publiclyVisible))
      .groupBy(concerns.id),
    getCopy(),
    getCurrentUser(),
  ]);

  const t = copy.coupe;
  const tCount = new Map(concernCounts.map((r) => [r.id, r.n]));

  const activePromos = promoRows
    .filter((p) => !p.endsAt || p.endsAt > new Date())
    .map((p) => ({ code: p.code, label: p.label, minSubtotalMillimes: p.minSubtotalMillimes, endsAt: p.endsAt }));

  const [lead, ...rest] = posts;
  const promoProducts = await getPromoShelfItems();
  const vitrineItems = shelf ? shelf.items.slice(0, 4) : promoProducts;
  const showVitrine = vitrineItems.length >= 2 || activePromos.length > 0;

  return (
    <>
      {/* PLANCHE 00 — the façade */}
      <Overture
        universes={universes.map((u) => ({ slug: u.slug, name: u.name, childCount: u.children.length || 1, image: u.image }))}
        facts={{ refs: refsRow?.n ?? 0, arcades: universes.length, houses: brandRows.length, boutiques: storeRows.length }}
      />

      {/* PLANCHE 01 — the counter */}
      <Counter items={featured} />

      {/* PLANCHE 02 — the arcades of the house (rayons as floors) */}
      <Floors
        universes={universes.map((u) => ({
          slug: u.slug,
          name: u.name,
          description: u.description,
          image: u.image,
          children: u.children.map((c) => ({ name: c.name, slug: c.slug })),
        }))}
      />

      {/* PLANCHE 03 — the lit vitrine below grade */}
      {showVitrine && (
        <Vitrine
          t={t.vitrine}
          title={shelf ? shelf.title : t.vitrine.title}
          subtitle={shelf ? (shelf.subtitle ?? t.vitrine.sub) : t.vitrine.sub}
          items={vitrineItems}
          promos={activePromos}
        />
      )}

      {/* PLANCHE 04 — the arrivals, dated by the stock, not the calendar */}
      <Arrivages t={t.arrivages} items={newArrivals} ctaHref="/boutique?sort=newest" />

      {/* PLANCHE 05 — the ledger of needs + the tear-off services */}
      <Ordonnance
        t={t.ordonnance}
        concerns={concernRows.map((c) => ({ slug: c.slug, name: c.name, intro: c.intro, n: tCount.get(c.id) ?? 0 }))}
        services={copy.home.conciergeItems}
      />

      {/* PLANCHE 06 — the arcades of the laboratories */}
      <Arcades
        t={t.arcades}
        brands={brandRows.map((b) => ({ slug: b.slug, name: b.name, country: b.country }))}
      />

      {/* PLANCHE 07 — the journal plates */}
      <Journal
        t={{ ...t.journal, minutes: copy.common.minutes }}
        lead={lead ? toArticle(lead) : null}
        rest={rest.map(toArticle)}
      />

      {/* PLANCHE 08 — the two real doors */}
      <Enseigne
        t={t.enseigne}
        stores={storeRows.map((s) => ({ slug: s.slug, name: s.name, address: s.address, city: s.city, phone: s.phone, hours: s.hours, mapsUrl: s.mapsUrl }))}
        facts={copy.facts}
        helpHref="/aide"
      />
    </>
  );
}

/** Promo products stand in the vitrine when no staff shelf is on season. */
async function getPromoShelfItems() {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      shortDescription: products.shortDescription,
      priceMillimes: products.priceMillimes,
      compareAtMillimes: products.compareAtMillimes,
      stock: products.stock,
      lowStockThreshold: products.lowStockThreshold,
      image: products.image,
      volume: products.volume,
      isNew: products.isNew,
      isCounterPick: products.isCounterPick,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      brandSlug: brands.slug,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, sql`${products.compareAtMillimes} is not null and ${products.compareAtMillimes} > ${products.priceMillimes}`))
    .orderBy(desc(sql`${products.compareAtMillimes} - ${products.priceMillimes}`))
    .limit(4);
  return rows;
}

function toArticle(a: { slug: string; title: string; tag: string | null; excerpt: string | null; image: string | null; readMinutes: number; publishedAt: Date | null }) {
  return { slug: a.slug, title: a.title, tag: a.tag ?? "", excerpt: a.excerpt ?? "", image: a.image, readMinutes: a.readMinutes, publishedAt: a.publishedAt };
}
