import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests, rituals, supportTickets, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CountUp } from "@/components/account/account-motion";
import { Reveal } from "@/components/motion/reveal";
import { Curve } from "@/components/kit/viz";
import { formatDTShort } from "@/lib/money";
import { HoldSeal, InFlightCard, LedgerRow, SectionBrow } from "@/components/orders/order-cards";
import { expiringAtHome, lotAdvice, reorderCandidates } from "@/lib/customer-data";
import { lotMonthLabel } from "@/lib/lots";
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

  const [orderCount, wishCount, activeSubs, openReturns, openTickets, ritualCount, recent, ledger] = await Promise.all([
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

    // Le registre des douze mois — the guest's own spending, month by month.
    // Cancelled orders are left out: nobody wants to be reminded of a basket
    // they never paid for.
    db.execute(sql`
      select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
             coalesce(sum(total_millimes), 0)::bigint as total,
             count(*)::int as n
      from ${orders}
      where user_id = ${user.id}
        and status <> 'cancelled'
        and created_at >= date_trunc('month', now()) - interval '11 months'
      group by 1
      order by 1
    `),
  ]);

  const next = recent.find((o) => ["pending", "confirmed", "preparing", "shipped"].includes(o.status));
  /* Deux choses qu'une pharmacie sait et qu'un site marchand oublie de dire :
     ce qui va périmer chez la cliente, et ce qu'elle est probablement en train
     de finir. Les deux viennent de ses propres achats, jamais d'un modèle. */
  const [atHome, toReorder] = await Promise.all([expiringAtHome(user.id), reorderCandidates(user.id)]);

  // Twelve months, including the empty ones — a curve that skips a month lies
  // about the shape of a year.
  const rows = (ledger as unknown as { rows: { month: string; total: string | number; n: number }[] }).rows ?? [];
  const byMonth = new Map(rows.map((r) => [r.month, Number(r.total)]));
  const months = Array.from({ length: 12 }, (_, k) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - k));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: d.toLocaleDateString("fr-TN", { month: "short" }).replace(".", ""),
      value: byMonth.get(key) ?? 0,
    };
  });
  const yearTotal = months.reduce((a, m) => a + m.value, 0);
  const bestMonth = months.reduce((a, b) => (b.value > a.value ? b : a));

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

      {/* ── La courbe du registre — a year of the guest's own house ──
          Every point is a month the till recorded; the empty months are
          drawn as empty, because a curve that skips them would lie about
          the shape of a year. */}
      {yearTotal > 0 && (
        <Reveal y={14} amount={0.05}>
          <section className="border border-line/70 bg-canvas p-6 lg:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="kicker-xs text-faint">Le registre, douze mois</p>
                <p className="mt-2 font-ant text-[clamp(1.3rem,2.2vw,1.8rem)] uppercase leading-none text-carbon">
                  Ce que vous avez pris chez nous
                </p>
              </div>
              <div className="flex items-baseline gap-8">
                <div>
                  <p className="kicker-xs text-faint">Douze mois</p>
                  <p className="mt-1.5 font-ant text-[22px] text-carbon">{formatDTShort(yearTotal)}</p>
                </div>
                <div>
                  <p className="kicker-xs text-faint">Mois le plus fourni</p>
                  <p className="mt-1.5 font-ant text-[22px] text-carbon">{bestMonth.label}</p>
                </div>
              </div>
            </div>
            <Curve
              points={months.map((m) => ({ label: m.label, value: m.value }))}
              format={formatDTShort}
              className="mt-8 w-full"
            />
            <p className="mt-4 text-[12px] leading-relaxed text-faint">
              Commandes annulées exclues. Les mois sans achat sont laissés vides — la courbe
              descend, elle ne saute pas.
            </p>
          </section>
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

      {/* ── Ce qui va périmer chez vous ─────────────────────────────── */}
      {atHome.length > 0 && (
        <section>
          <SectionBrow index="02" eyebrow="Vos achats" title="Ce qui va périmer chez vous" />
          <ul className="mt-6 divide-y divide-line/60 border border-line/60 bg-porcelain">
            {atHome.map((x) => (
              <li key={`${x.orderNumber}-${x.name}-${x.lotNumber}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                <span className="min-w-0 flex-1">
                  {x.slug ? (
                    <Link href={`/produit/${x.slug}`} className="text-[14px] text-carbon underline decoration-line decoration-1 underline-offset-4 hover:decoration-iodine">
                      {x.name}
                    </Link>
                  ) : (
                    <span className="text-[14px] text-carbon">{x.name}</span>
                  )}
                  <span className="ml-2 font-mono text-[11px] text-faint">
                    {x.lotNumber ? `lot ${x.lotNumber}` : "lot non tracé"} · {lotMonthLabel(x.expiresAt)}
                  </span>
                </span>
                <span className={`shrink-0 text-[12px] tabular-nums ${x.days !== null && x.days <= 30 ? "text-iodine-deep" : "text-muted"}`}>{lotAdvice(x.days)}</span>
                <span className="shrink-0 font-mono text-[11px] text-faint">{x.orderNumber}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-muted">
            Ces dates sont celles des lots qui vous ont été livrés, pas une estimation. Une crème encore valable reste valable : nous préférons vous le rappeler que vous laisser jeter un tube à moitié plein.
          </p>
        </section>
      )}

      {/* ── À racheter bientôt ──────────────────────────────────────── */}
      {toReorder.length > 0 && (
        <section>
          <SectionBrow index="03" eyebrow="Votre rythme" title="Probablement à racheter" />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {toReorder.map((c) => (
              <li key={c.productId} className="border border-line/60 bg-porcelain px-5 py-4">
                {c.slug ? (
                  <Link href={`/produit/${c.slug}`} className="font-ant uppercase text-[1.15rem] leading-tight text-carbon hover:text-iodine-deep">
                    {c.name}
                  </Link>
                ) : (
                  <span className="font-ant uppercase text-[1.15rem] text-carbon">{c.name}</span>
                )}
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  Dernier achat il y a {c.daysSince} jours, votre rythme habituel est de {c.cadenceDays} jours.
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-muted">Calculé sur vos commandes passées uniquement — aucun modèle, aucune supposition.</p>
        </section>
      )}

      {/* ── The other rooms ─────────────────────────────────────────── */}
      <section>
        <SectionBrow index={atHome.length > 0 && toReorder.length > 0 ? "04" : "03"} eyebrow="Votre espace" title="Aller plus loin" />
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
