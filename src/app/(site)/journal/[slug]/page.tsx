import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { articleProducts, brands, products } from "@/db/schema";
import { articles } from "@/db/schema";
import { formatDTShort } from "@/lib/money";
import { getCopy } from "@/lib/i18n/server";
import { CartAddButton } from "@/components/experience/journal-products";
import { formatDate, jsonLd } from "@/lib/utils";
import { SITE_URL } from "@/lib/env";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
export const dynamic = "force-dynamic";
async function get(slug: string) { return db.query.articles.findFirst({ where: and(eq(articles.slug, slug), eq(articles.isPublished, true)) }); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await get((await params).slug);
  return a ? { title: a.title, description: a.excerpt ?? undefined, openGraph: { type: "article", title: a.title, description: a.excerpt ?? undefined, images: a.image ? [a.image] : [], publishedTime: a.publishedAt.toISOString() }, twitter: { card: "summary_large_image" } } : {};
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await get((await params).slug);
  if (!a) notFound();
  const [others, copy] = await Promise.all([
    db.select().from(articles).where(and(eq(articles.isPublished, true), ne(articles.id, a.id))).orderBy(desc(articles.publishedAt)).limit(2),
    getCopy(),
  ]);
  const t = copy.journal;
  // Commerce with a conscience: the references the article actually stands behind.
  const links = await db.select().from(articleProducts).where(eq(articleProducts.articleId, a.id));
  let mentioned: { id: number; slug: string; name: string; brandName: string | null; priceMillimes: number; image: string | null; stock: number; volume: string | null; note: string | null }[] = [];
  if (links.length) {
    mentioned = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        brandName: brands.name,
        priceMillimes: products.priceMillimes,
        image: products.image,
        stock: products.stock,
        volume: products.volume,
        note: articleProducts.note,
      })
      .from(articleProducts)
      .innerJoin(products, eq(products.id, articleProducts.productId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(and(eq(articleProducts.articleId, a.id), sql`${products.status} = 'active'`))
      .limit(2);
  }
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, image: a.image ? [`${SITE_URL}${a.image}`] : [], datePublished: a.publishedAt.toISOString(), author: a.author ? { "@type": "Person", name: a.author } : { "@type": "Organization", name: "Cléopâtre — Espace Santé Beauté" } };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <div className="bg-petrol text-canvas">
        <div className="shell py-block lg:py-block-lg">
          <Link href="/journal" className="inline-flex min-h-10 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-canvas/55 transition-colors hover:text-iodine"><ArrowLeftIcon size={13} /> {t.title}</Link>
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="kicker-xs mb-6 text-canvas/45">{a.tag} · {a.readMinutes} min de lecture</p>
            <h1 className="font-ant uppercase text-h2 leading-tight sm:text-h1">{a.title}</h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-canvas/70">{a.excerpt}</p>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-canvas/45">
              {formatDate(a.publishedAt)} —{" "}
              {a.author ? (
                <span>
                  {a.author}
                  {a.authorRole ? <span className="normal-case opacity-75">, {a.authorRole}</span> : null}
                </span>
              ) : (
                "L’équipe Cléopâtre"
              )}
            </p>
          </div>
        </div>
      </div>

      {a.image && (
        <div className="relative mx-auto aspect-[21/9] w-full max-w-6xl overflow-hidden bg-line lg:-mt-10">
          <Image src={a.image} alt="" fill priority sizes="(max-width:1280px) 100vw, 1024px" className="object-cover" />
        </div>
      )}

      <div className="shell py-block lg:py-block-lg">
        <div className="mx-auto max-w-2xl">
          {a.body.split("\n\n").map((p, i) => (
            <p key={i} className={`font-ant uppercase ${i === 0 ? "first-para text-xl leading-[1.75] text-carbon sm:text-[1.35rem]" : "mt-7 text-[1.125rem] leading-[1.85] text-carbon"}`}>{p}</p>
          ))}
          {mentioned.length > 0 && (
            <section className="mt-12 border-t border-line pt-8">
              <p className="kicker-xs mb-5">{t.mentioned}</p>
              <ul className="space-y-3">
                {mentioned.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b border-line/60 pb-3 last:border-b-0">
                    <Link href={`/produit/${p.slug}`} className="min-w-0 flex-1 text-[14px] text-carbon transition-colors hover:text-iodine-deep">
                      <span className="block font-ant uppercase text-[16px] leading-snug">{p.name}</span>
                      {p.note && <span className="mt-0.5 block text-[12px] text-muted">{p.note}</span>}
                    </Link>
                    <span className="text-[12.5px] tabular-nums text-muted">{formatDTShort(p.priceMillimes)}</span>
                    <CartAddButton line={{ productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume }} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-14 flex items-center gap-5 border-t border-line pt-8">
            <span className="h-px w-10 bg-iodine" />
            <p className="text-xs leading-relaxed text-muted">Cet article est donné à titre informatif. En cas de doute sur votre peau ou votre santé, nos pharmaciens vous reçoivent à Ezzahra et Hammam-Lif, sans rendez-vous.</p>
          </div>
        </div>
      </div>

      {/* À lire ensuite */}
      {others.length > 0 && (
        <div className="border-t border-line bg-mist">
          <div className="shell py-block">
            <p className="kicker-xs mb-8">À lire ensuite</p>
            <div className="grid gap-10 sm:grid-cols-2">
              {others.map((o) => (
                <Link key={o.id} href={`/journal/${o.slug}`} className="group flex items-center gap-6 border-t border-line pt-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-line">
                    {o.image && <Image src={o.image} alt="" fill sizes="96px" className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.06]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">{o.tag} · {o.readMinutes} min</p>
                    <p className="mt-1.5 font-ant uppercase text-xl text-carbon transition-colors group-hover:text-iodine-deep">{o.title}</p>
                  </div>
                  <ArrowRightIcon size={16} className="ms-auto shrink-0 text-faint transition-transform duration-500 group-hover:translate-x-1 group-hover:text-carbon rtl-mirror" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
