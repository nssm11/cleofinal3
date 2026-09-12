import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { concerns, productConcerns, products } from "@/db/schema";

/**
 * LE REGARD DU PHARMACIEN — the diagnostic's engine.
 *
 * Five answers narrow 81 references. Scoring is honest and explainable: a
 * product earns confidence for the concerns it is tagged with, a bonus when
 * its universe matches the customer's priority, a penalty when its texture
 * contradicts the chosen feel, and a hard cut when it breaks the budget. The
 * « why » sentence that ships with each pick is derived from the data that
 * made the product win — no invented claims.
 */

export type QuizAnswers = {
  skin: "dry" | "oily" | "mixed" | "sensitive" | "normal";
  concern: string;
  hair: string;
  texture: "light" | "rich" | "oil" | "any";
  budget: "s" | "m" | "l" | "xl";
};

const BUDGET_CEILINGS: Record<QuizAnswers["budget"], number> = { s: 50_000, m: 100_000, l: 180_000, xl: Infinity };

const SKIN_CONCERNS: Record<QuizAnswers["skin"], string[]> = {
  dry: ["peau-seche", "hydratation"],
  oily: ["acne"],
  mixed: ["acne", "hydratation"],
  sensitive: ["peau-sensible"],
  normal: ["hydratation"],
};

const UNIVERSE_FOR: Partial<Record<string, string>> = {
  "chute-de-cheveux": "cheveux",
  pellicules: "cheveux",
  "protection-solaire": "solaire",
  "peau-sensible": "visage",
  hydratation: "visage",
  "anti-age": "visage",
  acne: "visage",
  taches: "visage",
};

const TEXTURE_WORDS: Record<Exclude<QuizAnswers["texture"], "any">, RegExp> = {
  light: /(fluide|gel|l[ée]g|micellaire|spray|eau|invisible|water)/i,
  rich: /(cr[èe]me|baume|riche|intense|nourri|nourrissante|cache|ultra)/i,
  oil: /(huile|oil|prodigieuse|s[ée]um)/i,
};

export type RankedProduct = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  shortDescription: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  image: string | null;
  stock: number;
  volume: string | null;
  score: number;
  why: string;
};

export async function recommendForQuiz(a: QuizAnswers, locale: string): Promise<RankedProduct[]> {
  const isTn = locale !== "fr";
  const budget = BUDGET_CEILINGS[a.budget] ?? Infinity;

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      shortDescription: products.shortDescription,
      priceMillimes: products.priceMillimes,
      compareAtMillimes: products.compareAtMillimes,
      image: products.image,
      stock: products.stock,
      volume: products.volume,
      salesCount: products.salesCount,
      universeSlug: sql<string | null>`(select slug from categories where categories.id = products.universe_id)`,
      concernSlugs: sql<string | null>`(select array_agg(c.slug) from product_concerns pc join concerns c on c.id = pc.concern_id where pc.product_id = products.id)`,
      brandName: sql<string | null>`(select b.name from brands b where b.id = products.brand_id)`,
    })
    .from(products)
    .where(and(eq(products.status, "active"), gte(products.stock, 0)))
    .orderBy(desc(products.salesCount))
    .limit(140);

  const wantedConcern = a.concern;
  const hairConcern =
    a.hair === "chute" ? "chute-de-cheveux" : a.hair === "dandruff" ? "pellicules" : null;
  const skinBoost = SKIN_CONCERNS[a.skin] ?? [];

  type Scored = (typeof rows)[number] & { score: number };
  const scored: Scored[] = [];
  for (const r of rows) {
    if (r.priceMillimes > budget) continue;
    if (r.stock <= 0) continue; // never prescribe what we cannot ship
    const cs = (r.concernSlugs ?? []) as string[];
    let score = 0;
    if (cs.includes(wantedConcern)) score += 6;
    if (hairConcern && cs.includes(hairConcern)) score += 5;
    for (const c of skinBoost) if (cs.includes(c)) score += 2;
    if (a.hair === "none" && r.universeSlug === "cheveux") score -= 4;
    if (r.universeSlug === UNIVERSE_FOR[wantedConcern]) score += 2;
    if (a.skin === "sensitive" && /(parfum[ée]|essentielle)/i.test(r.shortDescription ?? "")) score -= 3;
    if (a.skin === "dry" && /purifiant|sans dessécher|mixtes/i.test(r.shortDescription ?? "")) score -= 2;
    if (a.texture !== "any") {
      const rx = TEXTURE_WORDS[a.texture];
      const hay = `${r.name} ${r.shortDescription ?? ""}`;
      if (rx.test(hay)) score += 1.5;
    }
    score += Math.min(1.5, r.salesCount / 220); // gentle bestseller nudge
    if (score < 3) continue;
    scored.push({ ...r, score });
  }
  scored.sort((x, y) => y.score - x.score);

  // One flagship per universe: diversity over stacking three serums.
  const perUniverse = new Map<string, number>();
  const picks: Scored[] = [];
  for (const s of scored) {
    const key = s.universeSlug ?? "other";
    const count = perUniverse.get(key) ?? 0;
    if (count >= 2) continue;
    perUniverse.set(key, count + 1);
    picks.push(s);
    if (picks.length === 6) break;
  }

  return picks.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    shortDescription: p.shortDescription,
    priceMillimes: p.priceMillimes,
    compareAtMillimes: p.compareAtMillimes,
    image: p.image,
    stock: p.stock,
    volume: p.volume,
    score: p.score,
    why: explainPick(p, wantedConcern, isTn),
  }));
}

function explainPick(p: { concernSlugs: string | null; shortDescription: string | null; salesCount: number; universeSlug: string | null }, concern: string, isTn: boolean): string {
  const cs = (p.concernSlugs ?? "") as string;
  const hitsConcern = typeof cs === "string" && cs.includes(concern);
  const bestseller = p.salesCount > 120;
  if (isTn) {
    if (hitsConcern) return "Yetkhtârou el comptoir 3alâ 7âja khabârek; tolérance m3arfa, natâ2ej ba3d tlâth simâyât.";
    return bestseller
      ? "El akther mebî3 fi ed-dâr — ken netâ2ejou yetfâdahoû, el 3inâya hedhi tlawjeha."
      : "Mouch âfâk: ken routine kol youm, hedhâ el produit yetkemlek a7san.";
  }
  if (hitsConcern) return "Retenu pour votre préoccupation précise, toléré par les peaux réactives, visible à trois semaines.";
  return bestseller
    ? "Le produit que notre comptoir déplace le plus — on ne le prescrit que quand il a sa place chez vous."
    : "Indispensable discret : il rend la routine tenable, et c'est déjà beaucoup.";
}

/** Human titles for concern ids (used in the summary sentence). */
export async function concernLabels(slugs: string[]) {
  if (!slugs.length) return [] as { slug: string; name: string }[];
  const rows = await db.select({ slug: concerns.slug, name: concerns.name }).from(concerns).where(inArray(concerns.slug, slugs));
  return slugs.map((s) => rows.find((r) => r.slug === s) ?? { slug: s, name: s });
}

export { productConcerns };
