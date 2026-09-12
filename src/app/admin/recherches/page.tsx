import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { analyticsEvents, queryLandings, searchEvents } from "@/db/schema";
import { AdminPage, Table } from "@/components/admin/ui";
import { LandingForm, LandingRow } from "@/components/admin/search-curate";
export const dynamic = "force-dynamic";
export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const [top, zero, oos, landings, activity] = await Promise.all([
    db.select({ q: searchEvents.query, n: sql<number>`count(*)::int`, avg: sql<number>`round(avg(results_count))::int` }).from(searchEvents).groupBy(searchEvents.query).orderBy(desc(sql`count(*)`)).limit(30),
    db.select({ q: searchEvents.query, n: sql<number>`count(*)::int` }).from(searchEvents).where(eq(searchEvents.resultsCount, 0)).groupBy(searchEvents.query).orderBy(desc(sql`count(*)`)).limit(30),
    db.select({ q: searchEvents.query, n: sql<number>`count(*) filter (where ${searchEvents.outOfStock})::int` }).from(searchEvents).where(eq(searchEvents.outOfStock, true)).groupBy(searchEvents.query).orderBy(desc(sql`count(*)`)).limit(30),
    db.select().from(queryLandings).orderBy(desc(queryLandings.updatedAt)).limit(30),
    db
      .select({ name: analyticsEvents.name, n: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} > now() - interval '30 days'`)
      .groupBy(analyticsEvents.name)
      .orderBy(desc(sql`count(*)`)),
  ]);
  return (
    <AdminPage title="Recherches" sub="Ce que vos clients cherchent">
      <div className="grid gap-8 lg:grid-cols-2">
        <div><h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-admin-muted">Requêtes populaires</h2><Table head={["Requête", "Occurrences", "Résultats moy."]}>{top.map((r) => <tr key={r.q}><td className="px-4 py-2.5">{r.q}</td><td className="px-4 py-2.5 tabular-nums">{r.n}</td><td className="px-4 py-2.5 tabular-nums">{r.avg}</td></tr>)}</Table>{top.length === 0 && <p className="p-4 text-sm text-admin-muted">Aucune donnée.</p>}</div>
        <div><h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-admin-muted">Sans résultat (opportunités)</h2><Table minWidth="min-w-[420px]" head={["Requête", "Occurrences", <span key="a" className="sr-only">Curater</span>]}>{zero.map((r) => <tr key={r.q}><td className="px-4 py-2.5">{r.q}</td><td className="px-4 py-2.5 tabular-nums">{r.n}</td><td className="px-4 py-2.5 text-right"><Link href={`/admin/recherches?new=${encodeURIComponent(r.q)}`} className="text-[9px] font-bold uppercase tracking-[0.14em] text-admin-gold hover:underline">Épingler une porte</Link></td></tr>)}</Table>{zero.length === 0 && <p className="p-4 text-sm text-admin-muted">Aucune donnée — tant que la maison n&rsquo;a pas reçu de recherche, cette table reste vide, et c&rsquo;est justice.</p>}</div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div><h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-admin-muted">Trouvé mais en rupture — réassort</h2><Table minWidth="min-w-[380px]" head={["Requête", "Ruptures"]}>{oos.map((r) => <tr key={r.q}><td className="px-4 py-2.5">{r.q}</td><td className="px-4 py-2.5 tabular-nums">{r.n}</td></tr>)}</Table>{oos.length === 0 && <p className="p-4 text-sm text-admin-muted">Aucune recherche ne tombe sur des rayons vides.</p>}</div>
        <div>
          <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-admin-muted">Renvois épinglés</h2>
          <LandingForm presetQuery={sp.new ?? ""} />
          {landings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {landings.map((l) => <LandingRow key={l.id} id={l.id} query={l.query} kind={l.kind} label={l.label} href={l.href} />)}
            </ul>
          )}
        </div>
        <div><h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-admin-muted">Activité interne — 30 jours</h2><Table minWidth="min-w-[260px]" head={["Événement", "Occurrences"]}>{activity.map((a) => <tr key={a.name}><td className="px-4 py-2.5 font-mono text-xs">{a.name}</td><td className="px-4 py-2.5 tabular-nums">{a.n}</td></tr>)}</Table>{activity.length === 0 && <p className="p-4 text-sm text-admin-muted">Rien de mesuré pour l&rsquo;instant — la table grandit avec les commandes, les diagnostics, les listes et les retours.</p>}</div>
      </div>
    </AdminPage>
  );
}
