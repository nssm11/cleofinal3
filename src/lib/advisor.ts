import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, concerns, products, productConcerns } from "@/db/schema";
import { advisorPriorities, type AdvisorAnswers } from "./advisor-questions";

/**
 * LE CALCUL DU CONSEIL — côté serveur uniquement.
 *
 * Le classement est explicite : somme des poids des préoccupations portées,
 * puis note moyenne, puis volume de ventes. Rien d'opaque — on peut refaire le
 * calcul à la main depuis `advisor-questions.ts`.
 *
 * Ne renvoie que du disponible : conseiller une référence épuisée est la
 * meilleure façon de perdre la confiance gagnée par le questionnaire.
 */

/** Les pondérations et le questionnaire vivent dans un module sans base de
 *  données, pour rester importables depuis le navigateur. */
export * from "./advisor-questions";

export type AdvisorPick = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  volume: string | null;
  ratingAvg: number;
  ratingCount: number;
  /** Le « pourquoi » de cette référence, dérivé des préoccupations qu'elle porte. */
  matched: string[];
};

/**
 * Les références conseillées.
 *
 * Le classement est explicite : somme des poids des préoccupations portées,
 * puis note moyenne, puis volume de ventes. Rien d'opaque — on peut refaire le
 * calcul à la main depuis ce fichier.
 *
 * Ne renvoit que du disponible : conseiller une référence épuisée est la
 * meilleure façon de perdre la confiance gagnée par le questionnaire.
 */
export async function getAdvisorRecommendations(answers: AdvisorAnswers): Promise<AdvisorPick[]> {
  const { weights, limit } = advisorPriorities(answers);
  const slugs = [...weights.keys()];
  if (slugs.length === 0) return [];

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      image: products.image,
      priceMillimes: products.priceMillimes,
      compareAtMillimes: products.compareAtMillimes,
      volume: products.volume,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: sql<string | null>`max(${brands.name})`,
      matched: sql<string>`string_agg(distinct ${concerns.slug}, ',')`,
      score: sql<number>`sum(case ${sql.join(
        slugs.map((slug) => sql`when ${concerns.slug} = ${slug} then ${weights.get(slug) ?? 0}`),
        sql` `,
      )} else 0 end)::int`,
    })
    .from(products)
    .innerJoin(productConcerns, eq(productConcerns.productId, products.id))
    .innerJoin(concerns, eq(concerns.id, productConcerns.concernId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(products.status, "active"), gt(products.stock, 0), inArray(concerns.slug, slugs)))
    .groupBy(products.id)
    .orderBy(desc(sql`sum(case ${sql.join(
      slugs.map((slug) => sql`when ${concerns.slug} = ${slug} then ${weights.get(slug) ?? 0}`),
      sql` `,
    )} else 0 end)`), desc(products.ratingAvg), desc(products.salesCount))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    brandName: r.brandName,
    image: r.image,
    priceMillimes: r.priceMillimes,
    compareAtMillimes: r.compareAtMillimes,
    volume: r.volume,
    ratingAvg: r.ratingAvg,
    ratingCount: r.ratingCount,
    matched: (r.matched || "").split(",").filter(Boolean),
  }));
}
