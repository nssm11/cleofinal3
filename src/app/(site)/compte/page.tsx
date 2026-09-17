import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests, rituals, supportTickets, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CountUp } from "@/components/account/account-motion";
import { Reveal } from "@/components/motion/reveal";
import { HoldSeal, InFlightCard, LedgerRow, SectionBrow } from "@/components/orders/order-cards";
import { EmptyState } from "@/components/feedback/feedback";
import {
  ArrowRightIcon,
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
 * LA VUE D'ENSEMBLE — the first room of the private space, rebuilt dense.
 *
 * The first viewport carries everything that counts: four seals (what the
 * guest holds), the travelling order with its road in miniature, then the
 * register and the six doors. Same ledger queries as ever — every number
 * still opens onto the room it can act from.
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

  const doors = [
    { href: "/compte/favoris", label: "Mes favoris", value: wishCount[0].n, icon: <HeartIcon size={16} /> },
    { href: "/compte/rituels", label: "Mon rituel", value: ritualCount[0].n, icon: <MoonIcon size={16} /> },
    { href: "/compte/abonnement", label: "Mon abonnement", value: activeSubs[0].n, icon: <RefreshIcon size={16} /> },
    { href: "/compte/support", label: "Conciergerie", value: openTickets[0].n, icon: <ChatIcon size={16} /> },
    { href: "/compte/retours", label: "Mes retours", value: openReturns[0].n, icon: <SwapIcon size={16} /> },
    { href: "/compte/profil", label: "Mon profil", value: "→", icon: <UserIcon size={16} /> },
  ];

  return (
    <div className="space-y-10 lg:space-y-12">
      {/* ── What the guest holds ────────────────────────────────────── */}
      <Reveal y={12} amount={0.05}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HoldSeal value={<CountUp value={orderCount[0].n} />} label="Commandes" icon={<PackageIcon size={16} />} href="/compte/commandes" />
          <HoldSeal value={<CountUp value={user.loyaltyPoints} />} label="Points fidélité" icon={<StarIcon size={16} />} href="/compte/fidelite" />
          <HoldSeal value={<CountUp value={wishCount[0].n} />} label="Favoris" icon={<HeartIcon size={16} />} href="/compte/favoris" />
          <HoldSeal value={<CountUp value={activeSubs[0].n} />} label="Abonnements actifs" icon={<RefreshIcon size={16} />} href="/compte/abonnement" />
        </div>
      </Reveal>

      {/* ── The order in flight ─────────────────────────────────────── */}
      {next && (
        <Reveal y={14} amount={0.05}>
          <InFlightCard
            number={next.number}
            status={next.status}
            createdAt={next.createdAt}
            totalMillimes={next.totalMillimes}
            items={next.items.map((i) => ({ id: i.id, image: i.image, name: i.name, quantity: i.quantity, unitPriceMillimes: i.unitPriceMillimes }))}
          />
        </Reveal>
      )}

      {/* ── The ledger ──────────────────────────────────────────────── */}
      <section>
        <SectionBrow index="01" eyebrow="Le registre" title="Vos dernières commandes" action={{ href: "/compte/commandes", label: "Tout voir" }} />
        {recent.length === 0 ? (
          <Reveal y={10} className="mt-6">
            <div className="border border-dashed border-line-strong/70 bg-mist/50">
              <EmptyState
                icon={<PackageIcon size={20} />}
                title="Le registre est encore vide"
                description="Votre première commande : livraison offerte dès 99 DT, retrait possible en deux heures."
                action={{ href: "/boutique", label: "Parcourir la boutique" }}
              />
            </div>
          </Reveal>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((o, i) => (
              <Reveal as="li" key={o.id} y={14} delay={i * 0.06} amount={0.05} className="list-none">
                <LedgerRow
                  number={o.number}
                  date={o.createdAt}
                  totalMillimes={o.totalMillimes}
                  status={o.status}
                  items={o.items.map((it) => ({ id: it.id, image: it.image, name: it.name, quantity: it.quantity }))}
                />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* ── The other rooms ─────────────────────────────────────────── */}
      <section>
        <SectionBrow index="02" eyebrow="Votre espace" title="Aller plus loin" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {doors.map((d, i) => (
            <Reveal key={d.href} y={12} delay={(i % 3) * 0.06} amount={0.05}>
              <Link
                href={d.href}
                className="group flex items-center gap-4 border border-line/60 bg-porcelain px-5 py-4 shadow-sheet transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-[2px] hover:border-iodine-deep/50 hover:shadow-sheet"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-line/60 bg-mist/60 text-iodine-deep transition-colors duration-500 group-hover:border-iodine-deep/50">
                  {d.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-ant uppercase text-[1.35rem] leading-none tabular-nums text-carbon">{d.value}</span>
                  <span className="mt-1.5 block truncate text-[9.5px] font-bold uppercase tracking-[0.18em] text-faint transition-colors duration-500 group-hover:text-iodine-deep">
                    {d.label}
                  </span>
                </span>
                <ArrowRightIcon size={13} className="shrink-0 text-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-iodine-deep rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
