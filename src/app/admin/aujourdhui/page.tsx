import Link from "next/link";
import { attentionQueue } from "@/lib/admin/attention";
import { dayBook, timeline, timelineCounts, TIMELINE_KINDS, type TimelineKind } from "@/lib/admin/insights";
import { dbLatency } from "@/lib/admin/metrics";
import { RefreshControl } from "@/components/admin/os/controls";
import { EventStream, PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { BarChart } from "@/components/admin/os/charts";
import { OsLink, Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aujourd'hui" };

/**
 * AUJOURD'HUI
 *
 * The day as a chronology, not a dashboard: what the house did, hour by hour,
 * from every ledger that carries a timestamp — with the friction of the hour
 * beside it, so the day can be worked in order.
 */
export default async function TodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const dayParam = flat.jour ? new Date(`${flat.jour}T12:00:00`) : new Date();
  const day = Number.isNaN(dayParam.getTime()) ? new Date() : dayParam;
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const to = new Date(from.getTime() + 86_400_000);
  const kinds = (flat.types ? String(flat.types).split(",") : []).filter((k): k is TimelineKind => TIMELINE_KINDS.some((t) => t.key === k));

  const [events, counts, book, alerts, latency] = await Promise.all([
    timeline({ from, to, kinds: kinds.length ? kinds : undefined, limit: 200 }),
    timelineCounts(from, to),
    dayBook(day),
    attentionQueue(),
    dbLatency(),
  ]);

  const isToday = from.toDateString() === new Date().toDateString();
  const dayLink = (offsetDays: number) => {
    const d = new Date(from.getTime() + offsetDays * 86_400_000);
    return `/admin/aujourdhui?jour=${d.toISOString().slice(0, 10)}${kinds.length ? `&types=${kinds.join(",")}` : ""}`;
  };
  const toggleKind = (key: TimelineKind) => {
    const next = kinds.includes(key) ? kinds.filter((k) => k !== key) : [...kinds, key];
    return `/admin/aujourdhui?jour=${from.toISOString().slice(0, 10)}${next.length ? `&types=${next.join(",")}` : ""}`;
  };
  const totalEvents = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow={new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(from)}
        icon="clock"
        title={isToday ? "Aujourd'hui, heure par heure" : `Le ${new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "long" }).format(from)}`}
        sub={`${totalEvents} événement(s) enregistrés dans les registres de la maison${kinds.length ? ` (filtré sur ${kinds.length} nature(s))` : ""}. Chaque ligne est horodatée par la base, pas par l'interface.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OsLink href={dayLink(-1)} variant="quiet" size="sm">‹ Jour précédent</OsLink>
            <OsLink href="/admin/aujourdhui" variant={isToday ? "primary" : "ghost"} size="sm">Aujourd&apos;hui</OsLink>
            <OsLink href={dayLink(1)} variant="quiet" size="sm">Jour suivant ›</OsLink>
            <RefreshControl intervalSeconds={60} label="Rafraîchir" />
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Commandes du jour", value: <AnimatedNumber value={book.orders} />, sub: `${book.buyers} cliente(s) · ${book.cancelled} annulée(s)`, tone: "gold", href: `/admin/commandes?p=custom&from=${book.day}&to=${book.day}` },
          { label: "Chiffre d'affaires du jour", value: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(book.revenue / 1000)} DT`, sub: "commandes non annulées" },
          { label: "Événements", value: <AnimatedNumber value={totalEvents} />, sub: "toutes natures confondues" },
          { label: "Frictions ouvertes", value: <AnimatedNumber value={alerts.length} />, sub: `base ${latency.ms} ms · ${alerts.filter((a) => a.severity === "critical").length} critique(s)`, tone: alerts.length ? "warn" : "good", href: "/admin/attention" },
        ]}
      />

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Sheet padded={false}>
          <div className="border-b border-os-line px-4 py-3">
            <p className="os-label text-os-faint">Filtrer la journée</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link href={toggleKindAll(from)} className={cn("border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em]", kinds.length === 0 ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line text-os-muted hover:text-os-text")}>
                Tout
              </Link>
              {TIMELINE_KINDS.map((k) => {
                const active = kinds.includes(k.key);
                const count = counts[k.key] ?? 0;
                return (
                  <Link
                    key={k.key}
                    href={toggleKind(k.key)}
                    title={k.hint}
                    className={cn("flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em]", active ? "border-os-gold bg-os-gold-soft text-os-gold-2" : count === 0 ? "border-os-line-soft text-os-faint/70" : "border-os-line text-os-muted hover:text-os-text")}
                  >
                    {k.label}
                    <span className="os-num">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="max-h-[46rem] overflow-y-auto os-scroll">
            <EventStream events={events} />
          </div>
        </Sheet>

        <div className="grid gap-3">
          <Panel eyebrow="Rythme du jour" title="Commandes par heure" sub="Les heures sans commande sont des heures réelles" padded={false}>
            <div className="px-4 py-3">
              <BarChart
                points={Array.from({ length: 24 }, (_, h) => {
                  const found = book.hours.find((x) => x.hour === h);
                  return { label: `${String(h).padStart(2, "0")}h`, value: found?.orders ?? 0 };
                })}
                height={140}
                tone="gold"
                format={{ kind: "count", suffixes: ["commande", "commandes"] }}
              />
            </div>
          </Panel>

          <Panel eyebrow="À traiter maintenant" title="Frictions les plus lourdes" sub="Tirées du centre d'attention, pas d'une seconde source">
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.key} className="flex items-start justify-between gap-3 border-b border-dashed border-os-line-soft pb-2 last:border-0">
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-os-text">{a.title}</span>
                    <span className="block truncate text-[11.5px] text-os-muted">{a.detail}</span>
                  </span>
                  <Link href={a.href} className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-os-gold">{a.action}</Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Lecture" title="Ce que cette journée dit" sub="Traduit en mots, jamais en score">
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-os-muted">
              <li>
                {book.orders === 0
                  ? "Aucune commande enregistrée : soit la journée est calme, soit elle n'est pas encore commencée."
                  : `${book.orders} commande(s) pour ${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(book.revenue / 1000)} DT, panier moyen de ${book.orders ? new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(book.revenue / book.orders / 1000) : 0} DT.`}
              </li>
              <li>
                Heure la plus active :{" "}
                {book.hours.length
                  ? `${String(book.hours.reduce((a, b) => (b.orders > a.orders ? b : a)).hour).padStart(2, "0")} h`
                  : "aucune commande horodatée aujourd'hui"}
                .
              </li>
              <li>
                {counts.stock ?? 0} mouvement(s) de stock, {counts.wishlist ?? 0} ajout(s) en liste d&apos;envie, {counts.search ?? 0} recherche(s) :{" "}
                {((counts.wishlist ?? 0) > (counts.order ?? 0) ? "le désir devance l'achat aujourd'hui." : "l'achat suit de près la visite.")}
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag tone="info">horodatage base de données</Tag>
              <Tag tone="neutral">aucune estimation</Tag>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function toggleKindAll(from: Date) {
  return `/admin/aujourdhui?jour=${from.toISOString().slice(0, 10)}`;
}
