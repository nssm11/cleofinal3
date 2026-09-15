import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, loyaltyTransactions, orders, products, subscriptionItems, subscriptions, supportTickets, users, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminPage, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { CustomerNote, RoleSelect } from "@/components/admin/inline-actions";
import { Tag } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";

const TICKET_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "neutral" | "info" }> = {
  open: { label: "Ouvert", tone: "warn" },
  answered: { label: "Répondu", tone: "info" },
  closed: { label: "Clos", tone: "neutral" },
};
const SUB_STATUS: Record<string, { label: string; tone: "good" | "warn" | "neutral" }> = {
  active: { label: "Actif", tone: "good" },
  paused: { label: "En pause", tone: "warn" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

/**
 * FICHE CLIENTE 360°
 *
 * Une cliente, vue du haut en bas : ce qu'elle a commandé, ce que ça vaut,
 * ce qu'elle veut, ce qu'elle attend, ce qu'elle nous a écrit. Chaque case
 * est lue dans la base au moment de l'ouverture — pas une ligne n'est
 * supposée.
 */
export default async function AdminClient({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [me, u, addr, ords, tickets, subs, loyalty, wishes] = await Promise.all([
    getCurrentUser(),
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.select().from(addresses).where(eq(addresses.userId, id)),
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    db.select().from(supportTickets).where(eq(supportTickets.userId, id)).orderBy(desc(supportTickets.createdAt)).limit(20),
    db.select().from(subscriptions).where(eq(subscriptions.userId, id)).orderBy(desc(subscriptions.createdAt)),
    db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.userId, id)).orderBy(desc(loyaltyTransactions.createdAt)).limit(6),
    db.select({ w: wishlistItems, p: products.name }).from(wishlistItems).leftJoin(products, eq(products.id, wishlistItems.productId)).where(eq(wishlistItems.userId, id)).orderBy(desc(wishlistItems.createdAt)).limit(8),
  ]);
  if (!u) notFound();

  const kept = ords.filter((o) => o.status !== "cancelled");
  const firstOrder = ords[ords.length - 1];
  const lastOrder = ords[0];
  const activeSubs = subs.filter((s) => s.status !== "cancelled");

  // Estimated value of the live subscriptions (real items, real prices).
  const subEstimates = await Promise.all(
    activeSubs.map(async (s) => {
      const items = await db.select({ price: products.priceMillimes, qty: subscriptionItems.quantity, name: products.name }).from(subscriptionItems).leftJoin(products, eq(products.id, subscriptionItems.productId)).where(eq(subscriptionItems.subscriptionId, s.id));
      return { sub: s, total: items.reduce((a, i) => a + (i.price ?? 0) * (i.qty ?? 1), 0), names: items.map((i) => i.name).filter(Boolean).slice(0, 3) };
    }),
  );

  const next1000 = u.loyaltyPoints % 1000;

  return (
    <AdminPage
      title={`${u.firstName} ${u.lastName}`}
      sub={u.email}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="gold">{u.loyaltyPoints} points fidélité</Tag>
          {me?.role === "admin" && <RoleSelect userId={u.id} role={u.role} />}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── L'essentiel : ce qu'elle a commandé ─────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-os-line bg-os-surface px-4 py-3 shadow-os-sheet">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-os-muted">Commandes</p>
                <p className="mt-1.5 font-display text-[1.6rem] leading-none text-os-text">{ords.length}</p>
              </div>
              <div className="border border-os-line bg-os-surface px-4 py-3 shadow-os-sheet">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-os-muted">Valeur totale</p>
                <p className="mt-1.5 font-display text-[1.6rem] leading-none text-os-text">{formatDT(kept.reduce((a, o) => a + o.totalMillimes, 0))}</p>
              </div>
              <div className="border border-os-line bg-os-surface px-4 py-3 shadow-os-sheet">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-os-muted">Première commande</p>
                <p className="mt-1.5 truncate font-display text-[1.05rem] leading-[1.6] text-os-text">{firstOrder ? formatDate(firstOrder.createdAt) : "—"}</p>
              </div>
              <div className="border border-os-line bg-os-surface px-4 py-3 shadow-os-sheet">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-os-muted">Dernière commande</p>
                <p className="mt-1.5 truncate font-display text-[1.05rem] leading-[1.6] text-os-text">{lastOrder ? formatDate(lastOrder.createdAt) : "—"}</p>
              </div>
            </div>
          </div>

          <Panel title={`Commandes · ${ords.length}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-os-line text-left text-[10px] font-bold uppercase tracking-[0.16em] text-os-muted">
                    <th className="px-5 py-3">N°</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Paiement</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-line-soft">
                  {ords.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-os-surface-2/60">
                      <td className="px-5 py-3"><Link href={`/admin/commandes/${o.id}`} className="font-mono text-xs text-os-text hover:text-os-gold hover:underline">{o.number}</Link></td>
                      <td className="px-5 py-3 tabular-nums text-os-text">{formatDT(o.totalMillimes)}</td>
                      <td className="px-5 py-3"><StatusBadge s={o.status} /></td>
                      <td className="px-5 py-3 text-xs text-os-muted">{o.paymentStatus === "paid" ? "Encaissé" : o.paymentStatus === "pending" ? "En attente" : o.paymentStatus === "refunded" ? "Remboursé" : o.paymentStatus === "failed" ? "Refusé" : o.paymentStatus}</td>
                      <td className="px-5 py-3 text-xs text-os-muted">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ords.length === 0 && <p className="p-5 text-sm text-os-muted">Aucune commande — cette cliente n’a pas encore passé la porte.</p>}
            </div>
          </Panel>

          {tickets.length > 0 && (
            <Panel title={`Correspondance · ${tickets.length}`}>
              <ul className="divide-y divide-os-line-soft">
                {tickets.map((t) => {
                  const st = TICKET_STATUS[t.status] ?? { label: t.status, tone: "neutral" as const };
                  return (
                    <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[12.5px]">
                      <Tag tone={st.tone}>{st.label}</Tag>
                      <Link href="/admin/support" className="min-w-0 flex-1 truncate text-os-text hover:text-os-gold">{t.subject}</Link>
                      {t.orderNumber && <span className="font-mono text-[11px] text-os-muted">{t.orderNumber}</span>}
                      <span className="text-xs text-os-muted">{formatDate(t.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>

        {/* ── Le portrait : profil, fidélité, abonnements, envie ─────── */}
        <div className="space-y-6">
          <Panel title="Profil" className="p-5 text-sm">
            <ul className="space-y-2 text-[13px]">
              <li className="flex justify-between gap-3"><span className="text-os-muted">Téléphone</span><span className="text-os-text">{u.phone ?? "—"}</span></li>
              <li className="flex justify-between gap-3"><span className="text-os-muted">Inscrite le</span><span className="text-os-text">{formatDate(u.createdAt)}</span></li>
              <li className="flex justify-between gap-3"><span className="text-os-muted">Langue</span><span className="text-os-text">{u.locale === "fr" ? "Français" : u.locale === "tn" ? "Darija" : "العربية"}</span></li>
              <li className="flex justify-between gap-3"><span className="text-os-muted">E-mails conseil</span><span className="text-os-text">{u.emailOptIn ? "acceptés" : "refusés"}</span></li>
              {u.birthDate && <li className="flex justify-between gap-3"><span className="text-os-muted">Anniversaire</span><span className="text-os-text">{formatDate(u.birthDate)}</span></li>}
            </ul>
          </Panel>

          <Panel title="Fidélité" className="p-5 text-sm">
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-[1.9rem] leading-none text-os-text">{u.loyaltyPoints}</p>
              <p className="text-[11px] text-os-muted">points · 1 000 = 10 DT</p>
            </div>
            <div className="mt-3 h-1 w-full bg-os-surface-3">
              <div className="h-full bg-os-gold" style={{ width: `${Math.min(100, (next1000 / 1000) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-os-faint">encore {1000 - next1000} points avant le prochain 10 DT</p>
            {loyalty.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-os-line pt-3 text-[12px]">
                {loyalty.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-os-muted">{l.reason}</span>
                    <span className={l.points >= 0 ? "os-num text-os-text" : "os-num text-os-crit"}>{l.points >= 0 ? "+" : ""}{l.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Abonnements · ${subs.length}`} className="p-5 text-sm">
            {subs.length === 0 ? (
              <p className="text-[12.5px] text-os-muted">Aucun abonnement.</p>
            ) : (
              <ul className="space-y-3">
                {subEstimates.map(({ sub, total, names }) => {
                  const st = SUB_STATUS[sub.status] ?? { label: sub.status, tone: "neutral" as const };
                  return (
                    <li key={sub.id}>
                      <div className="flex items-center justify-between gap-2">
                        <Tag tone={st.tone}>{st.label}</Tag>
                        <span className="os-num text-[12px] text-os-text">{formatDT(total)}</span>
                      </div>
                      <p className="mt-1.5 truncate text-[12.5px] text-os-text">{names.join(" · ") || "—"}</p>
                      <p className="text-[11px] text-os-faint">tous les {sub.frequencyDays} jours · prochain {sub.status === "active" ? formatDate(sub.nextDueAt) : "—"}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title={`Liste d'envie · ${wishes.length}`} className="p-5 text-sm">
            {wishes.length === 0 ? (
              <p className="text-[12.5px] text-os-muted">Rien d’envié pour l’instant.</p>
            ) : (
              <ul className="space-y-2">
                {wishes.map(({ w, p }) => (
                  <li key={w.productId}>
                    {p ? (
                      <Link href={`/admin/produits/${w.productId}`} className="flex items-center justify-between gap-2 text-[12.5px] text-os-text hover:text-os-gold">
                        <span className="min-w-0 flex-1 truncate">{p}</span>
                        <span className="shrink-0 text-[11px] text-os-faint">{formatDate(w.createdAt)}</span>
                      </Link>
                    ) : (
                      <span className="flex items-center justify-between gap-2 text-[12.5px] text-os-faint">
                        <span className="min-w-0 flex-1 truncate">référence retirée</span>
                        <span className="shrink-0 text-[11px]">{formatDate(w.createdAt)}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Adresses" className="p-5 text-sm">
            {addr.length === 0 ? (
              <p className="text-[12.5px] text-os-muted">Aucune adresse enregistrée.</p>
            ) : (
              <ul className="space-y-3">
                {addr.map((a) => (
                  <li key={a.id}>
                    <p className="flex items-center gap-2 text-[13px] text-os-text">
                      {a.label}
                      {a.isDefault && <Tag tone="gold">défaut</Tag>}
                    </p>
                    <p className="text-[12px] text-os-muted">{a.line1}, {a.city}, {a.governorate}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Notes internes" className="p-5">
            <CustomerNote userId={u.id} notes={u.notes ?? ""} />
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}
