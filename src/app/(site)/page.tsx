import type { Metadata } from "next";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, products, promotions, reviews, stores } from "@/db/schema";
import { getFeatured, getPromoProducts, getUniverses, publiclyVisible } from "@/lib/catalog";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { Hero, type HeroRayon } from "@/components/home/hero";
import { RayonsFilm, type RayonChapter } from "@/components/home/rayons-film";
import { Comptoir, Offres, Parole, Journal, Seuil } from "@/components/home/sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cléopâtre — Espace Santé Beauté",
  description:
    "Cinq rayons, quatre-vingt références vérifiées, un conseil de pharmacien. La maison de dermo-cosmétique Cléopâtre, à Ezzahra et Hammam-Lif, livre partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — Espace Santé Beauté",
    description: "Le soin est une science exacte. Cinq rayons, une sélection mesurée, livrée partout en Tunisie.",
    url: "/",
    images: ["/videos/posters/hero.jpg"],
  },
};

/**
 * LA VITRINE — the homepage as a sequence.
 *
 *   LE SEUIL      the statement, the film, the index of the five rayons
 *   LA TABLE      five chapters, one sticky frame — the cinematic centrepiece
 *   01 COMPTOIR   what the pharmacists lead with this week
 *   02 OFFRES     the promo codes that are live in the database right now
 *   03 PAROLE     four measured figures, three real reviews
 *   04 JOURNAL    the editorial voice, signed
 *   05 SEUIL      the two addresses, and the way to them
 *
 * Everything on this page is read from the database: products, prices, stock,
 * promotions, reviews, articles and stores. Nothing is mocked, nothing is
 * decorative invention — the art direction is the only thing that is authored.
 */
export default async function HomePage() {
  const [universes, featured, promoProducts, storeRows, promoRows, articleRows, productCount, brandCount, reviewStats, reviewRows] =
    await Promise.all([
      getUniverses(),
      getFeatured(7),
      getPromoProducts(6),
      db.select().from(stores).where(eq(stores.isActive, true)),
      db
        .select({ code: promotions.code, label: promotions.label })
        .from(promotions)
        .where(and(eq(promotions.isActive, true), or(isNull(promotions.endsAt), gt(promotions.endsAt, new Date()))))
        .limit(3),
      db
        .select({
          slug: articles.slug,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          tag: articles.tag,
          author: articles.author,
          readMinutes: articles.readMinutes,
          publishedAt: articles.publishedAt,
        })
        .from(articles)
        .where(eq(articles.isPublished, true))
        .orderBy(desc(articles.publishedAt))
        .limit(4),
      db.select({ n: sql<number>`count(*)::int` }).from(products).where(publiclyVisible),
      db.select({ n: sql<number>`count(*)::int` }).from(brands),
      db
        .select({ n: sql<number>`count(*)::int`, avg: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float8` })
        .from(reviews)
        .where(eq(reviews.status, "approved")),
      db
        .select({
          id: reviews.id,
          author: reviews.authorName,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          productName: products.name,
          productSlug: products.slug,
        })
        .from(reviews)
        .innerJoin(products, eq(reviews.productId, products.id))
        .where(and(eq(reviews.status, "approved"), publiclyVisible))
        .orderBy(desc(reviews.createdAt))
        .limit(3),
    ]);

  // How much the catalogue actually holds per rayon — the hero's readout.
  const perUniverse = await db
    .select({ universeId: products.universeId, n: sql<number>`count(*)::int` })
    .from(products)
    .where(publiclyVisible)
    .groupBy(products.universeId);
  const countFor = (id: number) => perUniverse.find((r) => r.universeId === id)?.n ?? 0;

  const heroRayons: HeroRayon[] = universes.slice(0, 5).map((u) => ({
    slug: u.slug,
    name: u.name,
    count: countFor(u.id),
  }));

  const chapters: RayonChapter[] = universes
    .slice(0, 5)
    .filter((u) => UNIVERSE_CINEMA[u.slug])
    .map((u) => {
      const film = UNIVERSE_CINEMA[u.slug];
      return {
        slug: u.slug,
        name: u.name,
        description: u.description,
        count: countFor(u.id),
        video: film.video,
        poster: film.poster,
        kicker: film.kicker,
        title: film.title,
      };
    });

  const total = productCount[0]?.n ?? 0;
  const reviewCount = reviewStats[0]?.n ?? 0;
  const reviewAvg = reviewStats[0]?.avg ?? 0;

  return (
    <>
      <Hero
        kicker="Maison de dermo-cosmétique — Ezzahra · Hammam-Lif"
        lines={["Le soin", "est une", "science exacte."]}
        lead="Cinq rayons, une sélection mesurée référence par référence par nos pharmaciennes, et la même exigence en ligne qu'au comptoir."
        primary={{ href: "/boutique", label: "Explorer la boutique" }}
        secondary={{ href: "/diagnostic", label: "Diagnostic de peau" }}
        rayons={heroRayons}
        facts={[
          `${total} références authentiques`,
          "Livraison 24–72 h partout en Tunisie",
          "Paiement à la livraison",
        ]}
      />

      <RayonsFilm items={chapters} />

      <Comptoir featured={featured} />

      <Offres products={promoProducts} promos={promoRows} />

      <Parole
        figures={[
          { value: String(total), label: "Références en ligne" },
          { value: String(brandCount[0]?.n ?? 0), label: "Laboratoires" },
          { value: String(reviewCount), label: "Avis vérifiés" },
          { value: reviewAvg > 0 ? `${reviewAvg.toFixed(1)}/5` : "—", label: "Note moyenne" },
        ]}
        reviews={reviewRows.map((r) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          title: r.title,
          body: r.body,
          productName: r.productName,
          productSlug: r.productSlug,
        }))}
      />

      <Journal articles={articleRows} />

      <Seuil
        stores={storeRows.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          city: s.city,
          phone: s.phone,
          hours: s.hours,
        }))}
      />
    </>
  );
}
