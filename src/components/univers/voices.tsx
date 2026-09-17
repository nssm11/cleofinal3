import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, reviews } from "@/db/schema";
import { Chapter } from "@/components/kit/surfaces";
import { Stars } from "@/components/ui/stars";

/* ══════════════════════════════════════════════════════════════════════════
   LES VOIX — what was actually said about what is actually sold here.

   Verified reviews of products in this universe, in a ruled index: the note,
   the words, the author, the reference and its laboratory. Nothing is
   invented, nothing is averaged into a marketing number.
   ══════════════════════════════════════════════════════════════════════════ */

export async function EditorReviews({ universeId, name }: { universeId: number; name: string }) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      authorName: reviews.authorName,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
      brandName: brands.name,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(products.universeId, universeId), eq(reviews.isVerified, true), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(3);

  if (rows.length === 0) return null;

  return (
    <section className="border-y border-line bg-mist">
      <div className="shell-wide py-block lg:py-block-lg">
        <Chapter
          index="04"
          label="Les voix"
          title={`Ce qu'on dit de ${name}`}
          lede="Avis publiés, rattachés à une référence achetée — la maison ne retient pas les mots doux pour les mettre en avant."
          align="between"
          className="mb-10"
        />
        <ul className="grid gap-px bg-line lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id} className="bg-mist">
              <figure className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating * 100} size={13} showCount={false} />
                  <span className="kicker-xs text-faint">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <blockquote className="text-[0.9375rem] leading-relaxed text-carbon">« {r.body} »</blockquote>
                <figcaption className="mt-auto border-t border-line pt-4">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                    {r.authorName} — achat vérifié
                  </p>
                  <Link
                    href={`/produit/${r.productSlug}`}
                    className="mt-2 block text-[0.8125rem] text-carbon transition-colors hover:text-iodine"
                  >
                    {r.productName}
                    {r.brandName && <span className="text-faint"> · {r.brandName}</span>}
                  </Link>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
