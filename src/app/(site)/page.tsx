import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, products, stores } from "@/db/schema";
import { getFeatured, getUniverses, publiclyVisible } from "@/lib/catalog";
import { EditorialProductGrid } from "@/components/catalog/editorial-product-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CLÉOPÂTRE — Système de soin",
  description: "Peau, cheveu, corps, soleil, bébé — sélection précise, conseil pharmacien, livraison Tunisie.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [universes, featured, latest, labs, storeRows, totalRow, perUniverse] = await Promise.all([
    getUniverses(),
    getFeatured(8),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(3),
    db
      .select({ name: brands.name, n: sql<number>`count(${products.id})::int` })
      .from(brands)
      .leftJoin(products, and(eq(products.brandId, brands.id), publiclyVisible))
      .groupBy(brands.id, brands.name)
      .orderBy(desc(sql`count(${products.id})`))
      .limit(8),
    db.select().from(stores).where(eq(stores.isActive, true)).orderBy(asc(stores.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(publiclyVisible),
    db
      .select({ universeId: products.universeId, n: sql<number>`count(*)::int` })
      .from(products)
      .where(publiclyVisible)
      .groupBy(products.universeId),
  ]);

  const countByUniverse = new Map(perUniverse.map((r) => [r.universeId, r.n]));
  const totalProducts = totalRow[0]?.n ?? 0;

  return (
    <>
      {/* ── HERO — SWISS PRECISION ───────────────────────────────── */}
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="grid lg:grid-cols-12 gap-px bg-line border-x border-line">
            {/* Left — typographic */}
            <div className="lg:col-span-8 bg-bg p-8 lg:p-12 flex flex-col justify-between min-h-[520px] lg:min-h-[640px]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">01 — Système</p>
                <h1 className="mt-8 font-sans text-[clamp(2.5rem,8vw,6.5rem)] font-bold leading-[0.85] tracking-[-0.04em]">
                  SYSTÈME
                  <br />
                  DE SOIN
                  <br />
                  <span className="text-text-secondary">PRÉCIS.</span>
                </h1>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-line pt-8 lg:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Références</p>
                  <p className="mt-2 font-sans text-[24px] font-semibold tracking-[-0.02em]">{totalProducts}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Rayons</p>
                  <p className="mt-2 font-sans text-[24px] font-semibold tracking-[-0.02em]">{universes.length}</p>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Comptoirs</p>
                  <p className="mt-2 font-sans text-[14px] leading-[1.4]">Ezzahra · Hammam-Lif<br />Livraison TN</p>
                </div>
              </div>
            </div>

            {/* Right — image + actions */}
            <div className="lg:col-span-4 bg-bg flex flex-col">
              <div className="relative aspect-[4/5] w-full bg-bg-2 overflow-hidden">
                <Image src="/images/hero.jpg" alt="" fill priority sizes="(max-width:1024px) 100vw, 33vw" className="object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-ink p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-inverse-muted">Officine dermo-cosmétique</p>
                  <p className="mt-2 font-sans text-[14px] leading-[1.4] text-paper">Peau, cheveu, corps, soleil, bébé — sélection pharmacien, authentique, mesurée.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-line mt-auto">
                <Link href="/boutique" className="bg-ink text-paper p-4 font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-ink-2 transition-colors">
                  Boutique →
                </Link>
                <Link href="/diagnostic" className="bg-bg p-4 font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-bg-2 transition-colors">
                  Diagnostic
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LABS — running index ──────────────────────────────────── */}
      <div className="border-b border-line bg-ink text-paper">
        <div className="flex gap-12 overflow-hidden py-3">
          <div className="flex gap-12 animate-[marquee_60s_linear_infinite] whitespace-nowrap">
            {labs.concat(labs).map((l, i) => (
              <span key={`${l.name}-${i}`} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                {l.name} <span className="text-text-inverse-muted">{String(l.n).padStart(2, "0")}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── UNIVERSES — strict grid ───────────────────────────────── */}
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="flex items-baseline justify-between gap-4 border-x border-line px-8 py-8 lg:px-12">
            <h2 className="font-sans text-[24px] font-semibold tracking-[-0.02em]">Rayons — 02</h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">5 univers, {totalProducts} références</p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-5">
            {universes.map((u) => (
              <Link key={u.id} href={`/univers/${u.slug}`} className="group bg-bg p-6 lg:p-8 flex flex-col min-h-[280px] hover:bg-bg-2 transition-colors">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {String(countByUniverse.get(u.id) ?? 0).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted group-hover:text-ink">→</span>
                </div>
                <h3 className="mt-auto font-sans text-[22px] font-semibold leading-[1.1] tracking-[-0.02em]">{u.name}</h3>
                <p className="mt-3 font-sans text-[13px] leading-[1.5] text-text-secondary line-clamp-3">{u.description ?? "Sélection précise, conseil pharmacien."}</p>
                <div className="mt-6 h-px w-full bg-line group-hover:bg-ink transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED — product grid ───────────────────────────────── */}
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="flex flex-wrap items-end justify-between gap-4 border-x border-line px-8 py-8 lg:px-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Comptoir — 03</p>
              <h2 className="mt-3 font-sans text-[32px] font-semibold leading-[1.0] tracking-[-0.03em]">Références du moment</h2>
            </div>
            <Link href="/boutique" className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4 hover:text-text-secondary">
              Toute la boutique →
            </Link>
          </div>
          <div className="border-x border-line">
            <EditorialProductGrid items={featured} cols={4} priorityCount={4} />
          </div>
        </div>
      </section>

      {/* ── JOURNAL — precise list ────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="border-b border-line">
          <div className="shell-wide">
            <div className="flex items-baseline justify-between gap-4 border-x border-line px-8 py-8 lg:px-12">
              <h2 className="font-sans text-[24px] font-semibold tracking-[-0.02em]">Journal — 04</h2>
              <Link href="/journal" className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">
                Tous les articles →
              </Link>
            </div>
            <div className="grid gap-px bg-line border border-line lg:grid-cols-12">
              {latest[0] && (
                <Link href={`/journal/${latest[0].slug}`} className="group lg:col-span-7 bg-bg p-8 lg:p-12 flex flex-col">
                  <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    <span>{latest[0].tag ?? "Conseil"}</span>
                    <span>·</span>
                    <span>{latest[0].readMinutes} min</span>
                  </div>
                  <h3 className="mt-6 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] group-hover:underline underline-offset-4">
                    {latest[0].title}
                  </h3>
                  <p className="mt-4 max-w-[52ch] font-sans text-[14px] leading-[1.6] text-text-secondary">{latest[0].excerpt}</p>
                  <div className="mt-auto pt-8">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] border-b border-ink pb-1">Lire —→</span>
                  </div>
                </Link>
              )}
              <div className="lg:col-span-5 bg-bg divide-y divide-line">
                {latest.slice(1).map((a) => (
                  <Link key={a.id} href={`/journal/${a.slug}`} className="group block p-6 lg:p-8 hover:bg-bg-2 transition-colors">
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                      <span>{a.tag ?? "Conseil"}</span>
                      <span>·</span>
                      <span>{a.readMinutes} min</span>
                    </div>
                    <h3 className="mt-3 font-sans text-[18px] font-medium leading-[1.2] tracking-[-0.01em] group-hover:underline underline-offset-4">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 font-sans text-[13px] leading-[1.5] text-text-secondary">{a.excerpt}</p>
                  </Link>
                ))}
                <div className="p-6 lg:p-8 flex gap-3">
                  <Link href="/diagnostic" className="btn-primary">Diagnostic</Link>
                  <Link href="/aide" className="btn-outline">Aide</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── STORES ─────────────────────────────────────────────────── */}
      <section>
        <div className="shell-wide">
          <div className="border-x border-line px-8 py-8 lg:px-12 flex items-baseline justify-between">
            <h2 className="font-sans text-[24px] font-semibold tracking-[-0.02em]">Comptoirs — 05</h2>
            <Link href="/boutiques" className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">
              Voir →
            </Link>
          </div>
          <div className="grid gap-px bg-line border border-line lg:grid-cols-12">
            <div className="lg:col-span-5 bg-bg-2 relative min-h-[320px]">
              <Image src="/images/maison.jpg" alt="" fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-line">
              {storeRows.map((s) => (
                <div key={s.id} className="bg-bg p-8">
                  <p className="font-sans text-[18px] font-semibold">{s.name}</p>
                  <p className="mt-3 font-sans text-[13px] leading-[1.6] text-text-secondary">
                    {s.address}
                    <br />
                    {s.city}
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-text-muted">{s.hours}</p>
                  <a href={`tel:+216${s.phone}`} className="mt-4 inline-block font-mono text-[11px] underline underline-offset-4">
                    +216 {s.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
