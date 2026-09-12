import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { Badge } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRightIcon, PackageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * The overview is a page of a ledger, not a control panel — and since Prompt
 * 09 it is deliberately lean: one line about what is happening now (the order
 * in flight), the record (last orders), and three quiet doors to the rooms
 * that hold the detail (fidelite, favoris, retours). No tiles, no duplicated
 * favorites grid, no points ledger echoed here — each number lives on the
 * page that can also act on it.
 */
export default async function ComptePage() {
  // Do not rely on the layout having redirected: Next renders the page alongside
  // it, so an anonymous request would otherwise dereference null.
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");

  const [recent, wishCount, openReturns] = await Promise.all([
    db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: desc(orders.createdAt),
      limit: 3,
      with: { items: true },
    }),
    db
      .select({ n: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, user.id)),
    db
      .select({ n: returnRequests.id })
      .from(returnRequests)
      .where(and(eq(returnRequests.userId, user.id), ne(returnRequests.status, "completed"))),
  ]);
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

      {/* ── Trois portes discretes ─────────────────────────────────── */}
      <Reveal y={8}>
        <ul className="grid gap-px border-y border-stone/70 py-2 text-center sm:grid-cols-3">
          {[
            { href: "/compte/fidelite", label: "Points fidélité", value: String(user.loyaltyPoints) },
            { href: "/compte/favoris", label: "Favoris", value: String(wishCount.length) },
            { href: "/compte/retours", label: "Retours en cours", value: String(openReturns.length) },
          ].map((x) => (
            <li key={x.href}>
              <Link
                href={x.href}
                className="group inline-flex items-baseline gap-3 px-5 py-3 transition-colors hover:text-champagne-2"
              >
                <span className="eyebrow text-muted-2 transition-colors group-hover:text-champagne-2">{x.label}</span>
                <span className="font-display text-[19px] tabular-nums leading-none text-ink transition-colors group-hover:text-champagne-2">
                  {x.value}
                </span>
                <ArrowRightIcon
                  size={11}
                  className="translate-y-px text-sand-2 transition-all duration-500 group-hover:translate-x-1 group-hover:text-champagne-2"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* ── Le registre ─────────────────────────────────────────────── */}
      <section>
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
                  <span className="w-24 text-right text-[14px] tabular-nums text-ink">{formatDT(o.totalMillimes)}</span>
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
    </div>
  );
}
