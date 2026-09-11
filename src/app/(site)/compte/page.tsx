import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyTransactions, orders, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getByIds } from "@/lib/catalog";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { Badge } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRightIcon, HeartIcon, PackageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * The overview is written as a page of a ledger, not as a control panel: one
 * line about what is happening now, one line of figures, then the record.
 */
export default async function ComptePage() {
  // Do not rely on the layout having redirected: Next renders the page alongside
  // it, so an anonymous request would otherwise dereference null.
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");

  const [recent, wishIds, spentRow, loyaltyHistory] = await Promise.all([
    db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: desc(orders.createdAt),
      limit: 3,
      with: { items: true },
    }),
    db
      .select({ id: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, user.id))
      .orderBy(desc(wishlistItems.createdAt))
      .limit(4),
    db.select().from(orders).where(eq(orders.userId, user.id)),
    db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, user.id))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(8),
  ]);

  const wished = await getByIds(wishIds.map((w) => w.id));
  const spent = spentRow.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.totalMillimes, 0);
  const next = recent.find((o) => ["pending", "confirmed", "preparing", "shipped"].includes(o.status));

  return (
    <div className="space-y-16">
      {/* ── En cours ──────────────────────────────────────────────── */}
      {next && (
        <Reveal y={12} amount={0.05}>
          <section className="relative overflow-hidden border border-stone-2/40 bg-cream/70">
            <span aria-hidden className="marble-veil opacity-30" />
            <div className="relative grid gap-px sm:grid-cols-[1.4fr_1fr]">
              <div className="p-7 lg:p-9">
                <p className="rule-label mb-5 text-champagne-2">Commande en cours</p>
                <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.9rem)] text-ink">{next.number}</h2>
                <p className="mt-3 text-[13px] text-muted">
                  Passée le {formatDate(next.createdAt)} ·{" "}
                  {next.items.reduce((a, i) => a + i.quantity, 0)} article
                  {next.items.reduce((a, i) => a + i.quantity, 0) > 1 ? "s" : ""} ·{" "}
                  {ORDER_STATUS_LABELS[next.status]}
                </p>
                <ul className="scrollbar-none mt-7 flex gap-5 overflow-x-auto pb-1">
                  {next.items.map((i) => (
                    <li key={i.id} className="flex shrink-0 items-center gap-3.5">
                      <span className="relative h-[68px] w-[56px] overflow-hidden bg-marble">
                        {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                      </span>
                      <span className="w-36">
                        <span className="block truncate text-[13px] text-charcoal">{i.name}</span>
                        <span className="mt-0.5 block text-[11.5px] text-muted-2">
                          {i.quantity} × {formatDT(i.unitPriceMillimes)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-between gap-8 border-t border-stone/70 p-7 sm:border-l sm:border-t-0 lg:p-9">
                <div>
                  <p className="eyebrow text-muted-2">Montant</p>
                  <p className="mt-3 font-display text-[clamp(1.8rem,3vw,2.3rem)] tabular-nums leading-none text-ink">
                    {formatDT(next.totalMillimes)}
                  </p>
                </div>
                <Link href={`/compte/commandes/${next.number}`} className="btn-primary w-full">
                  Suivre cette commande
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* ── Les chiffres ──────────────────────────────────────────── */}
      <section className="grid gap-8 border-y border-stone/70 py-8 sm:grid-cols-3 sm:gap-6">
        {[
          { t: "Points fidélité", v: String(user.loyaltyPoints), d: "10 points par DT d'achat · 1 000 points = 10 DT de remise" },
          { t: "Total commandé", v: formatDT(spent), d: "hors commandes annulées" },
          { t: "Favoris", v: String(wishIds.length), d: "dans votre sélection privée" },
        ].map((x, i) => (
          <Reveal key={x.t} y={10} delay={i * 0.05} className={i > 0 ? "sm:border-l sm:border-stone/70 sm:pl-6" : ""}>
            <p className="eyebrow text-muted-2">{x.t}</p>
            <p className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2rem)] tabular-nums leading-none text-ink">
              {x.v}
            </p>
            <p className="mt-2 text-[11.5px] text-muted-2">{x.d}</p>
          </Reveal>
        ))}
      </section>

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* ── Le registre ─────────────────────────────────────────── */}
        <section className="lg:col-span-7">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="rule-label mb-3">Le registre</p>
              <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.9rem)] text-ink">Vos dernières commandes</h2>
            </div>
            <Link href="/compte/commandes" className="btn-ghost shrink-0">
              Tout voir
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="border border-dashed border-stone-2/60 bg-cream/50 px-6 py-14 text-center">
              <PackageIcon size={20} className="mx-auto text-sand-2" />
              <p className="mt-4 font-display text-[19px] text-ink">Le registre est encore vide</p>
              <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
                Votre première commande : livraison offerte dès 99 DT, retrait possible en deux heures.
              </p>
              <Link href="/boutique" className="btn-secondary mt-7">
                Parcourir la boutique
              </Link>
            </div>
          ) : (
            <ul className="border-t border-stone/70">
              {recent.map((o, i) => (
                <li key={o.id} className="border-b border-stone/70">
                  <Link
                    href={`/compte/commandes/${o.number}`}
                    className="group flex items-center gap-5 py-5 transition-colors duration-500"
                  >
                    <span className="font-display text-[12px] italic tabular-nums text-muted-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] text-ink transition-colors group-hover:text-champagne-2">
                        {o.number}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-muted-2">
                        {formatDate(o.createdAt)} · {o.items.reduce((a, it) => a + it.quantity, 0)} article
                        {o.items.reduce((a, it) => a + it.quantity, 0) > 1 ? "s" : ""}
                      </span>
                    </span>
                    <Badge
                      tone={
                        o.status === "delivered"
                          ? "success"
                          : o.status === "cancelled"
                            ? "error"
                            : o.status === "shipped"
                              ? "outline"
                              : "accent"
                      }
                    >
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                    <span className="w-24 text-right text-[14px] tabular-nums text-ink">
                      {formatDT(o.totalMillimes)}
                    </span>
                    <ArrowRightIcon
                      size={13}
                      className="shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1 group-hover:text-champagne-2"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── La sélection privée ─────────────────────────────────── */}
        <section className="lg:col-span-5">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="rule-label mb-3">Sélection privée</p>
              <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.9rem)] text-ink">Vos favoris</h2>
            </div>
            <Link href="/compte/favoris" className="btn-ghost shrink-0">
              Gérer
            </Link>
          </div>

          {wished.length === 0 ? (
            <div className="border border-dashed border-stone-2/60 bg-cream/50 px-6 py-10 text-center">
              <HeartIcon size={18} className="mx-auto text-sand-2" />
              <p className="mt-3 text-[13px] text-muted">Aucun favori pour l&apos;instant.</p>
              <Link href="/boutique" className="link-underline mt-4 inline-flex text-[13px] text-ink">
                Trouver mes essentiels
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-7">
              {wished.map((w) => (
                <li key={w.id}>
                  <Link href={`/produit/${w.slug}`} className="group block">
                    <span className="relative block aspect-[4/5] overflow-hidden bg-marble">
                      {w.image && (
                        <Image
                          src={w.image}
                          alt=""
                          fill
                          sizes="200px"
                          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                        />
                      )}
                    </span>
                    <span className="mt-2.5 block text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-2">
                      {w.brandName}
                    </span>
                    <span className="mt-1 block truncate font-display text-[15px] text-charcoal transition-colors group-hover:text-champagne-2">
                      {w.name}
                    </span>
                    <span className="mt-1 block text-[12.5px] tabular-nums text-muted">
                      {formatDT(w.priceMillimes)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Le livre de points ─────────────────────────────────────── */}
      {loyaltyHistory.length > 0 && (
        <section className="border-t border-stone/70 pt-10">
          <p className="rule-label mb-3">Livre de points</p>
          <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.9rem)] text-ink">Vos mouvements de points</h2>
          <ul className="mt-6 divide-y divide-stone/70 border-y border-stone/70">
            {loyaltyHistory.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-4 py-3.5 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-charcoal">{m.reason}</span>
                <span className="hidden text-[11.5px] text-muted-2 sm:inline">{formatDate(m.createdAt)}</span>
                <span className={`shrink-0 tabular-nums ${m.points >= 0 ? "text-success" : "text-error"}`}>
                  {m.points >= 0 ? `+${m.points}` : m.points} pts
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-muted-2">10 points par DT d&apos;achat · 1 000 points = 10 DT de remise au moment de la commande.</p>
        </section>
      )}
    </div>
  );
}
