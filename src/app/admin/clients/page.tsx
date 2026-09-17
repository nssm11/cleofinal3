import Link from "next/link";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminPage, Table, abtnGhost, afield } from "@/components/admin/ui";
import { DownloadIcon } from "@/components/icons";
export const dynamic = "force-dynamic";
export default async function AdminClients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [rows, stats] = await Promise.all([
    db.select({ id: users.id, email: users.email, first: users.firstName, last: users.lastName, phone: users.phone, role: users.role, at: users.createdAt, n: sql<number>`count(${orders.id})::int`, spent: sql<number>`coalesce(sum(${orders.totalMillimes}) filter (where ${orders.status} <> 'cancelled'),0)::int` })
      .from(users).leftJoin(orders, sql`${orders.userId} = ${users.id}`).where(q ? or(ilike(users.email, `%${q}%`), ilike(users.firstName, `%${q}%`), ilike(users.lastName, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined).groupBy(users.id).orderBy(desc(users.createdAt)).limit(300),
    db.select({
      total: sql<number>`count(${users.id})::int`,
      buyers: sql<number>`count(${users.id}) filter (where exists (select 1 from orders o2 where o2.user_id = ${users.id} and o2.status <> 'cancelled'))::int`,
      fresh: sql<number>`count(${users.id}) filter (where ${users.createdAt} >= now() - interval '30 days')::int`,
    }).from(users),
  ]);
  const s = stats[0];
  return (
    <AdminPage title="Clientes" sub={`${rows.length} affichées · ${s?.total ?? 0} comptes dans le registre`} action={
      // CSV Route Handler (Content-Disposition: attachment), not a page.
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href="/api/admin/export/customers" className={abtnGhost}><DownloadIcon size={14} /> CSV</a>}>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="border border-ops-line bg-ops-sheet px-4 py-3 shadow-sheet"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ops-muted">Comptes</p><p className="mt-1.5 font-ant uppercase text-[1.5rem] leading-none text-ops-ink">{new Intl.NumberFormat("fr-TN").format(s?.total ?? 0)}</p></div>
        <div className="border border-ops-line bg-ops-sheet px-4 py-3 shadow-sheet"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ops-muted">Ont commandé</p><p className="mt-1.5 font-ant uppercase text-[1.5rem] leading-none text-ops-ink">{new Intl.NumberFormat("fr-TN").format(s?.buyers ?? 0)}</p></div>
        <div className="border border-ops-line bg-ops-sheet px-4 py-3 shadow-sheet"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ops-muted">Nouvelles · 30 jours</p><p className="mt-1.5 font-ant uppercase text-[1.5rem] leading-none text-ops-ink">{new Intl.NumberFormat("fr-TN").format(s?.fresh ?? 0)}</p></div>
      </div>
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone…" className={`${afield} max-w-xs`} /><button className={abtnGhost}>Rechercher</button></form>
      <Table head={["Cliente", "Contact", "Rôle", "Commandes", "Total", "Inscrite"]}>{rows.map((u) => <tr key={u.id} className="transition-colors hover:bg-ops-sheet-2/60"><td className="px-4 py-3"><Link href={`/admin/clients/${u.id}`} className="hover:underline">{u.first} {u.last}</Link></td><td className="px-4 py-3 text-xs text-ops-muted">{u.email}<br />{u.phone}</td><td className="px-4 py-3 text-xs uppercase tracking-[0.12em]">{u.role}</td><td className="px-4 py-3 tabular-nums">{u.n}</td><td className="px-4 py-3 tabular-nums">{formatDT(u.spent)}</td><td className="px-4 py-3 text-xs text-ops-muted">{formatDate(u.at)}</td></tr>)}</Table>
    </AdminPage>
  );
}
