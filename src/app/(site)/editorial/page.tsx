import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { FeatureHero, FeatureGrid, FeatureCard } from "@/components/next-features/public-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Hub éditorial",
  description: "Articles, guides, actifs et contenus de conseil.",
};

export default async function EditorialPage() {
  const rows = await db.select({ slug: articles.slug, title: articles.title, excerpt: articles.excerpt, tag: articles.tag, readMinutes: articles.readMinutes }).from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(9);
  return (
    <div>
      <FeatureHero
        eyebrow="Éditorial"
        title="Guides, journal et contenus utiles"
        description="Un hub éditorial qui regroupe les articles publiés, les guides d'achat, le dictionnaire ingrédients et les FAQ de découverte."
      />
      <section className="shell-wide space-y-10 py-14 lg:py-20">
        <FeatureGrid>
          <FeatureCard title="Guides d'achat" description="Sélections SPF, actifs, marques et besoins." href="/guides-achat" />
          <FeatureCard title="Dictionnaire ingrédients" description="Actifs, filtres UV, allergènes parfumants et cautions." href="/ingredients" />
          <FeatureCard title="FAQ" description="Réponses utiles pour stock, lots, retrait et conseil." href="/faq" />
        </FeatureGrid>
        <div className="grid gap-4 md:grid-cols-3">
          {rows.map((article) => (
            <article key={article.slug} className="border border-line/70 bg-porcelain p-5">
              <p className="kicker-xs text-faint">{article.tag ?? "Journal"} · {article.readMinutes} min</p>
              <h2 className="mt-2 font-ant uppercase text-[1.25rem] leading-tight text-carbon">{article.title}</h2>
              {article.excerpt && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted">{article.excerpt}</p>}
              <Link href={`/journal/${article.slug}`} className="mt-5 inline-flex text-[10px] font-bold uppercase tracking-[0.18em] text-iodine-deep">Lire</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
