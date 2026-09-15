import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests, rituals, supportTickets, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";
import {
  AccountCard,
  AccountHeader,
  cardPad,
  OrderJourney,
  OrderRow,
  QuickDoor,
  StatBlock,
  StatusDot,
} from "@/components/account/account-ui";
import { CountUp } from "@/components/account/account-motion";
import { Reveal } from "@/components/motion/reveal";
import {
  ChatIcon,
  HeartIcon,
  MoonIcon,
  PackageIcon,
  RefreshIcon,
  StarIcon,
  SwapIcon,
  UserIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * LA VUE D'ENSEMBLE — the first room of the private space.
 *
 * Four numbers set large (what the customer holds), the order that is
 * travelling right now (with the parcel's road in miniature), the ledger of
 * the last three, and six quiet doors to the other rooms. Nothing here
 * duplicates a room it does not open onto — every number has a place it can
 * act from.
 */
export default async function ComptePage() {
  // Do not rely on the layout having redirected: Next renders the page
  // alongside it, so an anonymous request would otherwise dereference null.
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");

  const [orderCount, wishCount, activeSubs, openReturns, openTickets, ritualCount, recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"))),
    db.select({ n: sql<number>`count(*)::int` }).from(returnRequests).where(and(eq(returnRequests.userId, user.id), ne(returnRequests.status, "completed"))),
    db.select({ n: sql<number>`count(*)::int` }).from(supportTickets).where(and(eq(supportTickets.userId, user.id), ne(supportTickets.status, "closed"))),
    db.select({ n: sql<number>`count(*)::int` }).from(rituals).where(eq(rituals.userId, user.id)),
    db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: desc(orders.createdAt),
      limit: 3,
      with: { items: true },
    }),
  ]);

  const next = recent.find((o) => ["pending", "confirmed", "preparing", "shipped"].includes(o.status));

  return (
    <div className="space-y-14 lg:space-y-16">
      {/* ── What the customer holds ───────────────────────────────────── */}
      <Reveal y={12} amount={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatBlock value={<CountUp value={orderCount[0].n} />} label="Commandes" icon={<PackageIcon size={16} />} href="/compte/commandes" />
          <StatBlock value={<CountUp value={user.loyaltyPoints} />} label="Points fidélité" icon={<StarIcon size={16} />} href="/compte/fidelite" />
          <StatBlock value={<CountUp value={wishCount[0].n} />} label="Favoris" icon={<HeartIcon size={16} />} href="/compte/favoris" />
          <StatBlock value={<CountUp value={activeSubs[0].n} />} label="Abonnements actifs" icon={<RefreshIcon size={16} />} href="/compte/abonnement" />
        </div>
      </Reveal>

      {/* ── The order in flight ───────────────────────────────────────── */}
      {next && (
        <Reveal y={14} amount={0.05}>
          <AccountCard accent>
            <div className="grid lg:grid-cols-[1.55fr_1fr]">
              <div className={cardPad}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="rule-label text-champagne-2">Commande en cours</p>
                  <StatusDot status={next.status} label={ORDER_STATUS_LABELS[next.status]} />
                </div>
                <h2 className="mt-5 font-display text-[clamp(1.5rem,2.6vw,2rem)] text-ink">{next.number}</h2>
                <p className="mt-2 text-[13px] text-muted">
                  Passée le {formatDate(next.createdAt)} · {next.items.reduce((a, i) => a + i.quantity, 0)} article
                  {next.items.reduce((a, i) => a + i.quantity, 0) > 1 ? "s" : ""}
                </p>
                <OrderJourney status={next.status} className="mt-6" />
                <ul className="scrollbar-none mt-8 flex gap-5 overflow-x-auto pb-1">
                  {next.items.map((i) => (
                    <li key={i.id} className="flex shrink-0 items-center gap-3.5">
                      <span className="relative h-[68px] w-[56px] overflow-hidden rounded-[2px] bg-marble">
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

              <div className="flex flex-col justify-between gap-8 border-t border-stone/60 bg-cream/50 p-7 lg:border-l lg:border-t-0 lg:p-9">
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
          </AccountCard>
        </Reveal>
      )}

      {/* ── The ledger ────────────────────────────────────────────────── */}
      <section>
        <AccountHeader
          index="01"
          eyebrow="Le registre"
          title="Vos dernières commandes"
          action={{ href: "/compte/commandes", label: "Tout voir" }}
        />
        {recent.length === 0 ? (
          <Reveal y={10} className="mt-8">
            <div className="rounded-[3px] border border-dashed border-stone-2/70 bg-cream/50 px-6 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stone-2/60 text-champagne-2">
                <PackageIcon size={20} />
              </span>
              <p className="mt-6 font-display text-display-sm text-ink">Le registre est encore vide</p>
              <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
                Votre première commande : livraison offerte dès 99 DT, retrait possible en deux heures.
              </p>
              <Link href="/boutique" className="btn-secondary mt-8">
                Parcourir la boutique
              </Link>
            </div>
          </Reveal>
        ) : (
          <ul className="mt-8 space-y-4">
            {recent.map((o, i) => (
              <Reveal as="li" key={o.id} y={14} delay={i * 0.06} amount={0.05}>
                <OrderRow number={o.number} date={o.createdAt} total={o.totalMillimes} status={o.status} items={o.items.map((it) => ({ id: it.id, image: it.image, name: it.name, quantity: it.quantity }))} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* ── The other rooms ───────────────────────────────────────────── */}
      <section>
        <AccountHeader index="02" eyebrow="Votre espace" title="Aller plus loin" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Reveal y={12} delay={0.02} amount={0.05}><QuickDoor href="/compte/favoris" label="Mes favoris" value={wishCount[0].n} icon={<HeartIcon size={17} />} /></Reveal>
          <Reveal y={12} delay={0.08} amount={0.05}><QuickDoor href="/compte/rituels" label="Mon rituel" value={ritualCount[0].n} icon={<MoonIcon size={17} />} /></Reveal>
          <Reveal y={12} delay={0.14} amount={0.05}><QuickDoor href="/compte/abonnement" label="Mon abonnement" value={activeSubs[0].n} icon={<RefreshIcon size={17} />} /></Reveal>
          <Reveal y={12} delay={0.2} amount={0.05}><QuickDoor href="/compte/support" label="Conciergerie" value={openTickets[0].n} icon={<ChatIcon size={17} />} /></Reveal>
          <Reveal y={12} delay={0.26} amount={0.05}><QuickDoor href="/compte/retours" label="Mes retours" value={openReturns[0].n} icon={<SwapIcon size={17} />} /></Reveal>
          <Reveal y={12} delay={0.32} amount={0.05}><QuickDoor href="/compte/profil" label="Mon profil" value="À jour" icon={<UserIcon size={17} />} /></Reveal>
        </div>
      </section>
    </div>
  );
}


