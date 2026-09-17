import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { queryLandings } from "@/db/schema";
import { Listing, type SP } from "@/components/catalog/listing";
import { concernsNearQuery, getUniverses, listProducts } from "@/lib/catalog";
import { logSearchAction } from "@/actions/shop";
import { getCopy } from "@/lib/i18n/server";
import { ProductGridSkeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RecherchePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  let total = -1;
  let allOos = false;
  if (q.length >= 2 && !sp.page) {
    const res = await listProducts({ q, perPage: 6 });
    total = res.total;
    allOos = res.total > 0 && res.items.length > 0 && res.items.every((it: { stock: number }) => it.stock <= 0);
    await logSearchAction(q, total, allOos);
  }
  const landings = q.length >= 2 ? await db.select().from(queryLandings).where(and(eq(queryLandings.query, q.toLowerCase().trim().slice(0, 200)), eq(queryLandings.kind, total === 0 ? "zero" : "oos"))).limit(1) : [];
  const landing = landings[0] ?? null;
  const [unis, copy, needs] = await Promise.all([getUniverses(), getCopy(), total === 0 ? concernsNearQuery(q, 5) : Promise.resolve([])]);
  const mm = copy.merch;

  return (
    <div>
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="border-x border-line px-8 py-12 lg:px-12 lg:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Recherche — 00</p>
            {q ? <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,4rem)] font-bold tracking-[-0.04em] leading-[0.9]">« {q} »</h1> : <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,4rem)] font-bold tracking-[-0.04em] leading-[0.9]">Que cherchez-vous ?</h1>}
            <p className="mt-4 max-w-[56ch] font-sans text-[14px] leading-[1.6] text-text-secondary">{q ? "Références classées par pertinence." : "Un actif, une marque, un besoin — toute la sélection."}</p>
            <form action="/recherche" className="mt-8 flex max-w-xl border-b border-ink">
              <input name="q" defaultValue={q} placeholder="Nom, marque, besoin…" className="h-[48px] flex-1 bg-transparent font-sans text-[15px] focus:outline-none" />
              <button type="submit" className="btn-primary h-[48px] border-l border-ink">Chercher</button>
            </form>
          </div>
        </div>
      </section>

      {q.length >= 2 && !sp.page && total === 0 ? (
        <section className="shell-wide">
          <div className="border-x border-line px-8 py-12 lg:px-12 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-sans text-[24px] font-semibold">{mm.szTitle}</h2>
              <p className="mt-3 font-sans text-[13px] text-text-secondary">{mm.szText}</p>
              <div className="mt-6 flex gap-3"><Link href="/boutique" className="btn-primary">Boutique</Link><Link href="/aide" className="btn-ghost">Aide</Link></div>
              {landing && <div className="mt-8 border border-ink bg-bg-2 p-6"><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Sélection préparée</p><p className="mt-3 font-sans text-[14px]">{landing.label}</p><Link href={landing.href} className="btn-ghost mt-4">Voir</Link></div>}
            </div>
            <div className="lg:col-span-7">
              {needs.length > 0 && <div><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Besoins proches</p><div className="mt-4 flex flex-wrap gap-2">{needs.map((n) => <Link key={n.slug} href={`/besoin/${n.slug}`} className="border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] hover:border-ink">{n.name}</Link>)}</div></div>}
              <div className="mt-10 border-t border-line pt-6"><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Rayons</p><div className="mt-4 grid gap-px bg-line border border-line sm:grid-cols-2">{unis.map((u) => <Link key={u.id} href={`/univers/${u.slug}`} className="bg-bg p-4 font-sans text-[14px] hover:bg-bg-2">{u.name}</Link>)}</div></div>
            </div>
          </div>
        </section>
      ) : (
        <section className="shell-wide py-12">
          <div className="border-x border-line px-8 lg:px-12">
            <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}><Listing base={{ q }} sp={sp} basePath="/recherche" hideConcerns /></Suspense>
          </div>
        </section>
      )}
    </div>
  );
}
