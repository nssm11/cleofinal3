import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { loyaltyTransactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { LOYALTY_KIND_LABELS, LOYALTY_TIERS, loyaltyProgress } from "@/lib/loyalty";
import { cn, formatDate } from "@/lib/utils";
import { SparkIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * LE CERCLE — le tableau de bord de fidélité.
 *
 * Trois choses, dans cet ordre : où j'en suis, ce que ça vaut, ce que le
 * palier suivant apporte. Un programme de fidélité se juge à une seule
 * question — « est-ce que je comprends ce que j'y gagne ? » — donc la valeur
 * en dinars est écrite en toutes lettres, pas laissée au calcul mental.
 *
 * Le registre suit : chaque mouvement, avec sa raison. Des points qui
 * apparaissent sans explication finissent par être suspectés.
 */
export default async function FidelitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/fidelite");

  const ledger = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.userId, user.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(30);

  const p = loyaltyProgress(user.loyaltyPoints);

  return (
    <div>
      <h2 className="font-display text-display-sm text-ink">Le Cercle</h2>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
        Vos points se gagnent à chaque commande et se dépensent à la caisse. Les paliers ne
        changent pas ce tarif&nbsp;: ils changent l&apos;attention qu&apos;on vous porte.
      </p>

      {/* ── Où j'en suis ────────────────────────────────────────────────── */}
      <section className="mt-8 border border-stone bg-cream/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-2 text-champagne-2">
              <SparkIcon size={13} /> Palier {p.tier.name}
            </p>
            <p className="mt-3 font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-none tabular-nums text-ink">
              {p.points.toLocaleString("fr-FR")}
              <span className="ml-2 font-sans text-[13px] font-normal uppercase tracking-[0.18em] text-muted">points</span>
            </p>
            <p className="mt-2 text-[13.5px] text-charcoal">
              Soit <strong className="font-medium text-ink">{p.value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} DT</strong> de
              remise utilisable à la caisse.
            </p>
          </div>

          <div className="min-w-[12rem] flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-2">{p.tier.name}</span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-2">
                {p.next ? p.next.name : "Palier atteint"}
              </span>
            </div>
            <div
              className="mt-2 h-1 w-full bg-stone-2"
              role="progressbar"
              aria-valuenow={Math.round(p.ratio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression vers le palier ${p.next?.name ?? "actuel"}`}
            >
              <div className="h-full bg-champagne-2 transition-[width] duration-700" style={{ width: `${p.ratio * 100}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-muted">
              {p.next
                ? `${p.remaining.toLocaleString("fr-FR")} points avant le palier ${p.next.name}.`
                : "Vous êtes au dernier palier — merci."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Les paliers ─────────────────────────────────────────────────── */}
      <section className="mt-10">
        <p className="eyebrow mb-4">Les trois paliers</p>
        <ul className="grid gap-5 sm:grid-cols-3">
          {LOYALTY_TIERS.map((t) => {
            const on = t.id === p.tier.id;
            const past = t.from <= p.points;
            return (
              <li
                key={t.id}
                className={cn(
                  "border p-5 transition-colors",
                  on ? "border-champagne bg-cream" : past ? "border-stone bg-cream/40" : "border-stone",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-[19px] text-ink">{t.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-2">
                    dès {t.from.toLocaleString("fr-FR")} pts
                  </p>
                </div>
                {on && <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-champagne-2">Votre palier</p>}
                <ul className="mt-4 space-y-2">
                  {t.perks.map((perk) => (
                    <li key={perk} className="flex gap-2 text-[13px] leading-snug text-charcoal">
                      <span aria-hidden className="mt-[7px] h-px w-3 shrink-0 bg-champagne" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Le registre ─────────────────────────────────────────────────── */}
      <section className="mt-10">
        <p className="eyebrow mb-4">Vos mouvements</p>
        {ledger.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun mouvement pour l&apos;instant. Vos premiers points arrivent à la première commande réglée.
          </p>
        ) : (
          <ul className="divide-y divide-stone border-y border-stone">
            {ledger.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] text-ink">
                    {LOYALTY_KIND_LABELS[l.kind] ?? l.kind}
                    <span className="text-muted"> — {l.reason}</span>
                  </p>
                  <p className="text-[11.5px] text-muted-2">{formatDate(l.createdAt)}</p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-mono text-[13.5px] tabular-nums",
                    l.points >= 0 ? "text-success" : "text-error",
                  )}
                >
                  {l.points >= 0 ? "+" : ""}
                  {l.points.toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[11.5px] leading-relaxed text-muted-2">
          Les points sont crédités quand la commande est réglée et repris si elle est annulée ou
          retournée. Aucune date d&apos;expiration n&apos;est appliquée.
        </p>
      </section>
    </div>
  );
}
