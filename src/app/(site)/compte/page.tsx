import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests, rituals, supportTickets, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDT } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");
  const [orderCount, wishCount, activeSubs, openReturns, openTickets, ritualCount, recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"))),
    db.select({ n: sql<number>`count(*)::int` }).from(returnRequests).where(and(eq(returnRequests.userId, user.id), ne(returnRequests.status, "completed"))),
    db.select({ n: sql<number>`count(*)::int` }).from(supportTickets).where(and(eq(supportTickets.userId, user.id), ne(supportTickets.status, "closed"))),
    db.select({ n: sql<number>`count(*)::int` }).from(rituals).where(eq(rituals.userId, user.id)),
    db.query.orders.findMany({ where: eq(orders.userId, user.id), orderBy: desc(orders.createdAt), limit: 3, with: { items: true } }),
  ]);

  const stats = [
    { label: "Commandes", value: orderCount[0].n, href: "/compte/commandes" },
    { label: "Points fidélité", value: user.loyaltyPoints, href: "/compte/fidelite" },
    { label: "Favoris", value: wishCount[0].n, href: "/compte/favoris" },
    { label: "Abonnements", value: activeSubs[0].n, href: "/compte/abonnement" },
  ];
  const doors = [
    { href: "/compte/favoris", label: "Favoris", value: wishCount[0].n },
    { href: "/compte/rituels", label: "Rituel", value: ritualCount[0].n },
    { href: "/compte/abonnement", label: "Abonnement", value: activeSubs[0].n },
    { href: "/compte/support", label: "Conciergerie", value: openTickets[0].n },
    { href: "/compte/retours", label: "Retours", value: openReturns[0].n },
    { href: "/compte/profil", label: "Profil", value: "→" },
  ];

  return (
    <div className="space-y-12">
      <div className="border-b border-line pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Compte — 00</p>
        <h1 className="mt-3 font-sans text-[32px] font-semibold tracking-[-0.02em]">Bonjour, {(user as any).firstName ?? user.email?.split("@")[0] ?? "vous"}.</h1>
      </div>

      <div className="grid gap-px bg-line border border-line grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-bg p-6 hover:bg-bg-2">
            <p className="font-sans text-[28px] font-bold tracking-[-0.02em] leading-none">{s.value}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Registre — 01</p>
          <ul className="mt-4 border-t border-line">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between border-b border-line py-4">
                <div><p className="font-mono text-[11px] text-text-muted">{new Date(o.createdAt).toLocaleDateString("fr-TN")}</p><p className="font-sans text-[14px] font-medium">{o.number}</p></div>
                <div className="text-right"><p className="font-sans text-[14px] font-semibold">{formatDT(o.totalMillimes)}</p><p className="font-mono text-[10px] uppercase tracking-[0.12em] border border-line px-1.5 py-0.5 inline-block mt-1">{o.status}</p></div>
                <Link href={`/compte/commandes/${o.number}`} className="btn-outline h-8 px-3 text-[11px]">Voir</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Votre espace — 02</p>
        <div className="mt-4 grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3">
          {doors.map((d) => (
            <Link key={d.href} href={d.href} className="bg-bg p-5 flex items-center justify-between hover:bg-bg-2">
              <div><p className="font-sans text-[20px] font-bold leading-none">{d.value}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{d.label}</p></div>
              <span className="font-mono text-[12px]">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
