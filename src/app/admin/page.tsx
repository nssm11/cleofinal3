import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { resolvePeriod, previousPeriod, sameperiodLastYear, periodQuery, formatDay, requestNow } from "@/lib/admin/period";
import {
  activityFeed, businessPulse, customerLadder, dbLatency, inventoryOverview, MEASUREMENT_GAPS, outstanding,
  paymentMix, pipeline, promotionsOverview, qualityAudit, revenueBreakdown, searchIntelligence, systemCounts,
  wishlistIntelligence,
} from "@/lib/admin/metrics";
import { attentionQueue, opportunities } from "@/lib/admin/attention";
import { cohortRetention, emailOps, promoPulse, searchPulse, seriesBundle, tradingRhythm, type SeriesKey } from "@/lib/admin/insights";
import { HeroCanvas, type HeroMetric } from "@/components/admin/os/hero-canvas";
import { AreaChart, BarList, BarChart, Donut, Funnel, Heatmap } from "@/components/admin/os/charts";
import { RefreshControl } from "@/components/admin/os/controls";
import { AnimatedNumber, CountOnView, Reveal } from "@/components/admin/os/motion";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, Instrument, Metric, Money, RankRow, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITY_LABEL: Record<string, string> = { critical: "Critique", high: "Élevé", normal: "Normal" };
const SEVERITY_TONE: Record<string, "bad" | "warn" | "neutral"> = { critical: "bad", high: "warn", normal: "neutral" };
const PAYMENT_LABEL: Record<string, string> = { cod: "Paiement à la livraison", bank_transfer: "Virement", card: "Carte", gift_card: "Carte cadeau" };

const METRIC_KEYS: { key: SeriesKey; label: string; short: string; hint: string; unit: "millimes" | "count" | "decimal" }[] = [
  { key: "revenue", label: "Chiffre d'affaires", short: "CA", hint: "Commandes non annulées, remises et livraison comprises", unit: "millimes" },
  { key: "orders", label: "Commandes", short: "Commandes", hint: "Commandes passées sur la période", unit: "count" },
  { key: "aov", label: "Panier moyen", short: "Panier", hint: "Chiffre d'affaires ÷ nombre de commandes", unit: "millimes" },
  { key: "units", label: "Unités vendues", short: "Unités", hint: "Somme des quantités vendues", unit: "count" },
  { key: "customers", label: "Clientes acheteuses", short: "Clientes", hint: "Comptes distincts ayant commandé", unit: "count" },
  { key: "discounts", label: "Remises accordées", short: "Remises", hint: "Montant total des remises appliquées", unit: "millimes" },
  { key: "refunds", label: "Remboursements", short: "Remb.", hint: "Commandes remboursées", unit: "millimes" },
];

/**
 * POSTE DE COMMANDE
 *
 * The first question of an operator's day — what happened, what is stuck, what
 * to do about it — answered on one canvas without a single invented figure.
 */
export default async function CommandCenter({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string | undefined>;
  const period = resolvePeriod({ p: flat.p, from: flat.from, to: flat.to });
  const prev = previousPeriod(period);
  const year = sameperiodLastYear(period);
  const metricKey = (METRIC_KEYS.find((m) => m.key === flat.m)?.key ?? "revenue") as SeriesKey;
  const compareOn = flat.cmp !== "0";
  const user = await getCurrentUser();

  const [pulse, bundle, prevBundle, lastYearBundle, alerts, opps, flows, stock, searches, wishes, ladder, mail, promos, cohorts, rhythm, activity, counts, quality, latency, topProducts, categoryRows, paymentRows, promosOverview, debt] =
    await Promise.all([
      businessPulse(period, prev, year),
      seriesBundle(period),
      seriesBundle(prev),
      seriesBundle(year),
      attentionQueue(),
      opportunities(),
      pipeline(period),
      inventoryOverview(),
      searchIntelligence(30),
      wishlistIntelligence(),
      customerLadder(),
      emailOps(period),
      promoPulse(period),
      cohortRetention(6),
      tradingRhythm(56),
      activityFeed({ from: new Date(requestNow() - 2 * 86_400_000), to: new Date(), limit: 16 }),
      systemCounts(),
      qualityAudit(),
      dbLatency(),
      revenueBreakdown(period, "product"),
      revenueBreakdown(period, "category"),
      paymentMix(period),
      promotionsOverview(),
      outstanding(period),
    ]);

  const heroMeta = METRIC_KEYS.find((m) => m.key === metricKey)!;
  const heroPoints = bundle[metricKey];
  const heroCurrent = heroMeta.key === "revenue" ? pulse.current.gross : heroMeta.key === "orders" ? pulse.current.orders : heroMeta.key === "units" ? pulse.current.units : heroMeta.key === "customers" ? pulse.current.buyers : heroMeta.key === "discounts" ? pulse.current.discounted : heroMeta.key === "refunds" ? pulse.current.refunded : pulse.rates.aov.current;
  const heroPrevious = heroMeta.key === "revenue" ? pulse.previous.gross : heroMeta.key === "orders" ? pulse.previous.orders : heroMeta.key === "units" ? pulse.previous.units : heroMeta.key === "customers" ? pulse.previous.buyers : heroMeta.key === "discounts" ? pulse.previous.discounted : heroMeta.key === "refunds" ? pulse.previous.refunded : pulse.rates.aov.previous;
  const heroYear = heroMeta.key === "revenue" ? pulse.year.gross : heroMeta.key === "orders" ? pulse.year.orders : heroMeta.key === "units" ? pulse.year.units : heroMeta.key === "customers" ? pulse.year.buyers : heroMeta.key === "discounts" ? pulse.year.discounted : heroMeta.key === "refunds" ? pulse.year.refunded : pulse.rates.aov.year;

  const hero: HeroMetric = {
    key: metricKey,
    label: heroMeta.label,
    short: heroMeta.short,
    hint: heroMeta.hint,
    unit: heroMeta.unit,
    value: heroCurrent,
    previous: heroPrevious,
    year: heroYear,
    pct: heroPrevious > 0 ? ((heroCurrent - heroPrevious) / heroPrevious) * 100 : null,
    dir: heroCurrent === heroPrevious ? "flat" : heroCurrent > heroPrevious ? "up" : "down",
    series: heroPoints.map((p) => ({ label: p.label, value: p.value, at: p.at })),
    compare: prevBundle[metricKey].map((p) => p.value),
    spark: heroPoints.slice(-14).map((p) => p.value),
    available: METRIC_KEYS.map((m) => ({ key: m.key, label: m.short })),
  };

  const secondary = [
    { key: "orders" as SeriesKey, label: "Commandes", unit: "count" as const },
    { key: "aov" as SeriesKey, label: "Panier moyen", unit: "millimes" as const },
    { key: "units" as SeriesKey, label: "Unités vendues", unit: "count" as const },
    { key: "customers" as SeriesKey, label: "Clientes acheteuses", unit: "count" as const },
  ].filter((s) => s.key !== metricKey).map((s) => {
    const cur = s.key === "orders" ? pulse.current.orders : s.key === "aov" ? pulse.rates.aov.current : s.key === "units" ? pulse.current.units : pulse.current.buyers;
    const pre = s.key === "orders" ? pulse.previous.orders : s.key === "aov" ? pulse.rates.aov.previous : s.key === "units" ? pulse.previous.units : pulse.previous.buyers;
    return {
      label: s.label, value: cur, unit: s.unit,
      deltaPct: pre > 0 ? ((cur - pre) / pre) * 100 : null,
      dir: cur === pre ? "flat" : cur > pre ? "up" : "down",
      spark: bundle[s.key].slice(-14).map((p) => p.value),
      href: `/admin/analytique?p=${period.key}&m=${s.key}`,
    } as const;
  });

  const critical = alerts.filter((a) => a.severity === "critical");
  const high = alerts.filter((a) => a.severity === "high");
  const topAlertValue = alerts.reduce((a, x) => Math.max(a, x.amount ?? 0), 0);
  const heroState = `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(Math.round(pulse.current.gross / 1000))} DT sur ${period.label.toLowerCase()}, ${pulse.rates.aov.dir === "up" ? "panier en hausse" : pulse.rates.aov.dir === "down" ? "panier en repli" : "panier stable"}, ${alerts.length} point${alerts.length > 1 ? "s" : ""} de friction.`;

  const today = new Date();
  const dateLabel = new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(today);
  const hour = today.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      {/* ── Ouverture ───────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-os-faint">
            {dateLabel} · {period.label}
          </p>
          <h1 className="mt-1.5 font-display text-[clamp(1.8rem,4.2vw,3rem)] leading-[0.98] tracking-tight text-os-text">
            {greeting}{user ? `, ${user.firstName}` : ""}. <span className="text-os-muted">{heroState}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshControl intervalSeconds={60} />
          <Link href="/admin/echanges" className="flex items-center gap-1.5 border border-os-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-muted transition-colors hover:text-os-text">
            <Glyph name="ledger" size={13} /> Rapports
          </Link>
        </div>
      </header>

      {/* ── Le grand chiffre ────────────────────────────────────────── */}
      <HeroCanvas hero={hero} period={period.key} from={flat.from} to={flat.to} compareOn={compareOn} secondary={secondary} />

      {/* ── Bande de pression ───────────────────────────────────────── */}
      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Instrument className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="os-label text-os-onink-muted">Charge à traiter</p>
              <p className="os-num mt-1 font-display text-[2.2rem] leading-none text-os-onink"><AnimatedNumber value={alerts.length} /></p>
              <p className="mt-1 text-[11px] text-os-onink-muted">{critical.length} critique · {high.length} élevé · {alerts.length - critical.length - high.length} normal</p>
            </div>
            <Glyph name="alert" size={20} className="text-os-gold" />
          </div>
          <Link href="/admin/attention" className="mt-3 flex items-center justify-between border-t border-os-ink-line pt-2 text-[11px] uppercase tracking-[0.12em] text-os-gold">
            Ouvrir le centre d&apos;attention <Glyph name="arrowRight" size={12} />
          </Link>
        </Instrument>

        <Sheet className="bg-os-surface">
          <p className="os-label text-os-muted">Valeur exposée</p>
          <p className="os-num mt-1 font-display text-[2.2rem] leading-none text-os-text"><AnimatedNumber value={topAlertValue} spec={{ kind: "dt", digits: 0 }} /></p>
          <p className="mt-1 text-[11px] text-os-muted">Montant cumulé des alertes qui portent un montant réel</p>
          <div className="mt-3 h-1.5 w-full bg-os-surface-3">
            <div className="h-full bg-os-crit" style={{ width: `${topAlertValue > 0 ? Math.min(100, (topAlertValue / Math.max(1, pulse.current.gross)) * 100) : 0}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-os-faint">{pulse.current.gross > 0 ? `${((topAlertValue / pulse.current.gross) * 100).toFixed(1)} % du chiffre d'affaires de la période` : "aucune vente sur la période"}</p>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">Commandes en cours</p>
          <div className="mt-2 space-y-1">
            {flows.slice(0, 4).map((s) => (
              <div key={s.status} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-os-muted">{s.label}</span>
                <span className="os-num flex items-center gap-2 text-os-text">
                  {s.count}
                  {s.avgAgeHours != null && <span className="text-[10px] text-os-faint">{Math.round(s.avgAgeHours)} h</span>}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/commandes" className="mt-3 block border-t border-os-line-soft pt-2 text-[11px] uppercase tracking-[0.12em] text-os-gold">Traiter les commandes</Link>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">Encaissement</p>
          <p className="os-num mt-1 font-display text-[2.2rem] leading-none text-os-text"><AnimatedNumber value={pulse.current.collected} spec={{ kind: "dt", digits: 0 }} /></p>
          <p className="mt-1 text-[11px] text-os-muted">
            {pulse.current.gross > 0 ? `${((pulse.current.collected / pulse.current.gross) * 100).toFixed(0)} % du CA encaissé` : "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag tone={debt.failed > 0 ? "bad" : "neutral"}>{debt.failed} paiement(s) refusé(s)</Tag>
            <Tag tone={debt.count > 0 ? "warn" : "neutral"}>{debt.count} en attente</Tag>
          </div>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">Catalogue</p>
          <div className="mt-1 flex items-end gap-4">
            <div>
              <p className="os-num font-display text-[2.2rem] leading-none text-os-text"><CountOnView value={quality.score} /></p>
              <p className="mt-1 text-[11px] text-os-muted">score qualité · {quality.issues.length} point(s)</p>
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-[11px]">
              <p className="flex justify-between"><span className="text-os-muted">Ruptures</span><span className="os-num text-os-crit">{stock.outOfStock}</span></p>
              <p className="flex justify-between"><span className="text-os-muted">Sous seuil</span><span className="os-num text-os-warn">{stock.low}</span></p>
              <p className="flex justify-between"><span className="text-os-muted">Dormants</span><span className="os-num text-os-muted">{stock.dead}</span></p>
            </div>
          </div>
          <Link href="/admin/produits/qualite" className="mt-3 block border-t border-os-line-soft pt-2 text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir l&apos;audit qualité</Link>
        </Sheet>
      </section>

      {/* ── Attention · Activité ────────────────────────────────────── */}
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Sheet padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <SectionHead eyebrow="Centre d'attention" title="Ce qui bloque aujourd'hui" sub="Classé par gravité réelle, pas par ancienneté" />
            <Link href="/admin/attention" className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-os-gold">Tout voir</Link>
          </div>
          <ul className="divide-y divide-os-line-soft">
            {alerts.slice(0, 7).map((a) => (
              <li key={a.key} className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-os-surface-2/60">
                <span className={cn("absolute left-0 top-0 h-full w-[3px]", a.severity === "critical" ? "bg-os-crit" : a.severity === "high" ? "bg-os-warn" : "bg-os-line-strong")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[13.5px] text-os-text">{a.title}</span>
                    <Tag tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Tag>
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-os-muted">{a.detail}</p>
                  {a.items?.length ? (
                    <p className="mt-1 truncate text-[11px] text-os-faint">{a.items.slice(0, 3).map((i) => i.label).join(" · ")}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {a.amount ? <span className="os-num text-[13px] text-os-text"><Money millimes={a.amount} /></span> : null}
                  <span className="os-num w-8 text-right font-display text-[1.3rem] text-os-text">{a.count}</span>
                  <Link href={a.href} className="border border-os-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-text transition-colors group-hover:border-os-ink group-hover:bg-os-ink group-hover:text-os-onink">
                    {a.action}
                  </Link>
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="p-5">
                <EmptyState title="Aucune friction détectée" why="Paiements, stock, préparation, avis, support et e-mails sont dans les seuils. Le contrôle se refait à chaque ouverture de cette page." />
              </li>
            )}
          </ul>
        </Sheet>

        <Sheet padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <SectionHead eyebrow="48 dernières heures" title="Activité" sub="Commandes, stock, clientes, avis, lettres" />
            <RefreshControl intervalSeconds={45} label="Rafraîchir" />
          </div>
          <ol className="relative max-h-[30rem] overflow-y-auto os-scroll px-4 py-2">
            <span className="absolute left-[4.6rem] top-2 bottom-2 w-px bg-os-line" aria-hidden />
            {activity.map((e) => (
              <li key={e.id} className="relative flex gap-3 py-2">
                <span className="os-num w-12 shrink-0 pt-0.5 text-right text-[11px] text-os-faint">
                  {new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" }).format(e.at)}
                </span>
                <span className={cn("relative mt-1 h-2 w-2 shrink-0 rounded-full",
                  e.tone === "bad" ? "bg-os-crit" : e.tone === "warn" ? "bg-os-warn" : e.tone === "good" ? "bg-os-ok" : "bg-os-line-strong")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-os-text">
                    {e.href ? <Link href={e.href} className="hover:text-os-gold">{e.title}</Link> : e.title}
                  </p>
                  <p className="truncate text-[11px] text-os-muted">{e.detail ?? "—"}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="border-t border-os-line px-4 py-2">
            <Link href="/admin/activite" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir l&apos;activité en direct</Link>
          </div>
        </Sheet>
      </section>

      {/* ── Opportunités · Demande · Listes d'envie ─────────────────── */}
      <section className="mt-3 grid gap-3 lg:grid-cols-3">
        <Sheet>
          <SectionHead eyebrow="Centre d'opportunités" title="Ce que les données proposent" sub="Chaque carte mène à l'écran où la décision se prend" />
          <ul className="mt-3 space-y-3">
            {opps.slice(0, 4).map((o) => (
              <li key={o.key} className="border-l-2 border-os-gold/60 pl-3">
                <p className="flex items-center gap-2 text-[13px] text-os-text">
                  {o.title} <Tag tone={o.severity === "chaud" ? "bad" : o.severity === "tiede" ? "warn" : "neutral"}>{o.severity}</Tag>
                </p>
                <p className="mt-0.5 text-[12px] text-os-muted">{o.detail}</p>
                <p className="os-num mt-1 text-[11px] text-os-faint">{o.evidence.slice(0, 2).map((e) => `${e.label} ${e.value}`).join(" · ")}</p>
                <Link href={o.href} className="mt-1.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-os-gold">
                  {o.action} <Glyph name="arrowRight" size={11} />
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Recherche · 30 jours" title="Ce que la maison cherche" sub={`${searches.totals.n} recherches · ${searches.totals.distinctQueries} requêtes distinctes`} />
          <div className="mt-3 space-y-1.5">
            {searches.top.slice(0, 6).map((s) => (
              <div key={s.query} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-1 text-[12px] last:border-0">
                <span className="min-w-0 flex-1 truncate text-os-text">« {s.query} »</span>
                <span className="os-num text-os-muted">{s.count}</span>
                {s.zero > 0 && <Tag tone="warn">{s.zero} vide</Tag>}
                {s.trend != null && <span className={cn("os-num w-12 text-right text-[11px]", s.trend >= 0 ? "text-os-ok" : "text-os-crit")}>{s.trend >= 0 ? "+" : ""}{s.trend.toFixed(0)} %</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-os-line pt-3">
            <p className="os-label text-os-muted">Requêtes sans résultat</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {searches.zero.slice(0, 6).map((z) => (
                <Tag key={z.query} tone={z.hasLanding ? "info" : "bad"} title={z.hasLanding ? "Une page d'atterrissage existe" : "Aucune curation"}>
                  {z.query} · {z.count}
                </Tag>
              ))}
            </div>
          </div>
          <Link href="/admin/recherches" className="mt-3 block border-t border-os-line-soft pt-2 text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir l&apos;intelligence de recherche</Link>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Listes d'envie" title="Désir non converti" sub={`${wishes.totals.items} ajouts · ${wishes.totals.products} produits · ${wishes.totals.owners} clientes`} />
          <div className="mt-3">
            <BarList
              rows={wishes.top.slice(0, 6).map((w) => ({ label: w.name, value: w.wishes, sub: `${w.units} vendu(s) · stock ${w.stock}${w.stock === 0 ? " — rupture" : ""}`, href: `/admin/produits/${w.id}`, image: w.image }))}
              format={{ kind: "count", suffixes: ["envie", "envies"] }}
            />
          </div>
          <div className="mt-3 border-t border-os-line pt-3">
            <p className="os-label text-os-muted">Parcours de la base cliente</p>
            <div className="mt-2">
              <Funnel stages={ladder.map((s) => ({ label: s.label, count: s.count, note: `${((s.count / Math.max(1, ladder[0].count)) * 100).toFixed(0)} % des comptes` }))} />
            </div>
          </div>
        </Sheet>
      </section>

      {/* ── Rythme · Cohorte · Classements ─────────────────────────── */}
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Sheet>
          <SectionHead
            eyebrow={`${rhythm.windowDays} jours`}
            title="Rythme de la maison"
            sub={`Pic : ${rhythm.days[rhythm.peakDay]} à ${String(rhythm.peakHour).padStart(2, "0")} h — ${rhythm.sample} commandes observées`}
            action={<Tag tone="info">Heure locale</Tag>}
          />
          <div className="mt-4">
            <Heatmap
              matrix={rhythm.matrix}
              rowLabels={rhythm.rowLabels}
              colLabels={rhythm.colLabels}
              format={{ kind: "count", suffixes: ["commande", "commandes"] }}
              tone="gold"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="os-label text-os-muted">Par jour</p>
              <div className="mt-2">
                <BarChart points={rhythm.byDay.map((v, i) => ({ label: rhythm.rowLabels[i], value: v }))} height={120} tone="ink" format={{ kind: "count", suffix: "commandes" }} />
              </div>
            </div>
            <div>
              <p className="os-label text-os-muted">Par heure</p>
              <div className="mt-2">
                <BarChart points={rhythm.byHour.map((v, h) => ({ label: `${String(h).padStart(2, "0")}h`, value: v }))} height={120} tone="gold" format={{ kind: "count", suffix: "commandes" }} />
              </div>
            </div>
          </div>
        </Sheet>

        <div className="grid gap-3">
          <Sheet padded={false}>
            <div className="border-b border-os-line px-4 py-3">
              <SectionHead eyebrow="Cohortes" title="Revenir, mois après mois" sub="Première commande → commandes des mois suivants" />
            </div>
            <div className="overflow-x-auto os-scroll px-4 py-3">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="text-os-faint">
                    <th className="os-label py-1 text-left">Mois</th>
                    <th className="os-label py-1 text-right">Cliente</th>
                    {Array.from({ length: 6 }).map((_, i) => <th key={i} className="os-label py-1 text-right">M{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.month} className="border-t border-os-line-soft">
                      <td className="py-1.5 text-os-text">{c.month}</td>
                      <td className="os-num py-1.5 text-right text-os-muted">{c.size}</td>
                      {c.periods.map((p, i) => (
                        <td key={i} className="py-1 text-right">
                          <span
                            className="os-num inline-block min-w-[2.4rem] px-1 py-0.5 text-[11px]"
                            style={{ background: p == null ? "transparent" : `color-mix(in oklab, var(--color-os-gold) ${Math.min(70, p)}%, transparent)`, color: p == null ? "var(--color-os-faint)" : "var(--color-os-text)" }}
                          >
                            {p == null ? "·" : `${p} %`}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sheet>

          <Sheet padded={false}>
            <div className="border-b border-os-line px-4 py-3">
              <SectionHead eyebrow="Classement" title="Produits qui portent la période" sub={`${topProducts.length} références vendues`} action={<Link href="/admin/analytique" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Explorer</Link>} />
            </div>
            <ul className="divide-y divide-os-line-soft px-4 py-1">
              {topProducts.slice(0, 6).map((p, i) => (
                <li key={p.label} className="py-2">
                  <RankRow
                    position={i + 1}
                    label={p.label}
                    sub={`${p.units} unité(s) · ${p.orders} commande(s)`}
                    value={new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(p.revenue / 1000)}
                    max={topProducts[0]?.revenue ?? 1}
                    href={`${p.id ? `/admin/produits/${p.id}` : "/admin/produits"}`}
                    image={p.image ?? null}
                  />
                </li>
              ))}
            </ul>
          </Sheet>
        </div>
      </section>

      {/* ── Rayons · Paiements · Promotions ────────────────────────── */}
      <section className="mt-3 grid gap-3 lg:grid-cols-3">
        <Sheet>
          <SectionHead eyebrow="Répartition" title="Par rayon" sub={`${categoryRows.length} rayons actifs sur la période`} />
          <div className="mt-3">
            <BarList rows={categoryRows.slice(0, 8).map((c) => ({ label: c.label, value: c.revenue, sub: `${c.units} unités`, href: `/admin/analytique?p=${period.key}&level=category&parent=universe&parentId=${c.id ?? ""}` }))} format={{ kind: "dt" }} />
          </div>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Encaissement" title="Moyens de paiement" sub="Ce que les clientes choisissent réellement" />
          <div className="mt-3">
            <Donut
              segments={paymentRows.map((p) => ({
                label: PAYMENT_LABEL[p.method] ?? p.method,
                value: p.value,
                tone: p.rate >= 70 ? "ok" : p.rate > 0 ? "warn" : "crit",
              }))}
              centerLabel="encaissé"
              center={new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(pulse.current.collected / 1000)}
            />
          </div>
          <div className="mt-3 space-y-1.5 border-t border-os-line pt-3 text-[12px]">
            {paymentRows.map((p) => (
              <div key={p.method} className="flex items-center justify-between gap-3">
                <span className="text-os-muted">{PAYMENT_LABEL[p.method] ?? p.method}</span>
                <span className="os-num text-os-text">
                  {p.count} · {p.rate.toFixed(0)} % réglé · {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(p.value / 1000)} DT
                </span>
              </div>
            ))}
          </div>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Promotions" title="Ce que les remises coûtent" sub={`${promosOverview.filter((p) => p.state === "live").length} code(s) en service · ${promosOverview.filter((p) => p.state === "scheduled").length} programmé(s)`} action={<Link href="/admin/promotions" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Studio</Link>} />
          <div className="mt-3 space-y-2">
            {promos.filter((p) => p.redeemed > 0).slice(0, 4).map((p) => (
              <div key={p.code} className="border-l-2 border-os-gold/50 pl-3">
                <p className="flex items-center gap-2 text-[13px] text-os-text">
                  <span className="os-num">{p.code}</span>
                  <Tag tone={p.isActive ? "good" : "neutral"}>{p.isActive ? "actif" : "clos"}</Tag>
                </p>
                <p className="os-num mt-0.5 text-[11px] text-os-muted">
                  {p.redeemed} commande(s) · remise {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(p.discountGiven / 1000)} DT · panier moyen {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(p.basket / 1000)} DT
                </p>
                <div className="mt-1 h-1 w-full bg-os-surface-3">
                  <div className="h-full bg-os-gold" style={{ width: `${p.usageLimit ? Math.min(100, (p.redeemed / p.usageLimit) * 100) : Math.min(100, p.redeemed * 4)}%` }} />
                </div>
              </div>
            ))}
            {promos.every((p) => p.redeemed === 0) && (
              <EmptyState title="Aucun code utilisé sur la période" why="Les codes actifs existent mais aucune commande n'en porte la trace sur cette fenêtre de temps." action={<Link href="/admin/promotions" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Créer une promotion</Link>} />
            )}
          </div>
        </Sheet>
      </section>

      {/* ── Instrumentation honnête · Système ──────────────────────── */}
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Sheet>
          <SectionHead
            eyebrow="Instrumentation"
            title="Ce que cette maison ne mesure pas encore"
            sub="Aucune estimation n'est affichée à la place : voici la capacité manquante, écran par écran"
            action={<Tag tone="warn">{MEASUREMENT_GAPS.length} capacités</Tag>}
          />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MEASUREMENT_GAPS.map((g) => (
              <li key={g.key} className="border border-os-line-soft bg-os-surface-2/40 p-3">
                <p className="flex items-center gap-2 text-[12.5px] text-os-text">
                  <Glyph name="info" size={14} className="text-os-warn" /> {g.label}
                  <span className="os-label ml-auto text-os-faint">{g.screen}</span>
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-os-muted">{g.needs}</p>
                <p className="mt-1 text-[11px] text-os-faint">{g.impact}</p>
              </li>
            ))}
          </ul>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Machine" title="État de l'instrument" sub={`Base de données ${latency.ok ? "joignable" : "en difficulté"} · ${latency.ms} ms`} action={<Link href="/admin/systeme" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Diagnostic complet</Link>} />
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-3">
            {[
              ["Commandes", counts.orders], ["Lignes", counts.items], ["Mouvements", counts.movements],
              ["Produits", counts.products], ["Clientes", counts.users], ["Recherches", counts.searches],
              ["Lettres", counts.emails], ["En échec", counts.emails_failed], ["Avis", counts.reviews],
              ["Événements", counts.events], ["Audits", counts.audits], ["Retours", counts.returns],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-baseline justify-between gap-2 border-b border-dashed border-os-line-soft py-1">
                <dt className="text-os-muted">{label}</dt>
                <dd className="os-num text-os-text">{new Intl.NumberFormat("fr-TN").format(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-os-line pt-3">
            <Metric label="Lettres en échec" value={mail.failed} size="sm" tone={mail.failed ? "bad" : "neutral"} sub={`${mail.pending} en attente`} />
            <Metric label="Encours à recouvrer" value={debt.value / 1000} size="sm" unit="DT" tone={debt.value ? "warn" : "neutral"} sub={`${debt.count} commande(s) non réglée(s)`} />
          </div>
        </Sheet>
      </section>

      {/* ── Fil du temps sur 14 jours (repère secondaire) ──────────── */}
      <section className="mt-3">
        <Sheet padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <SectionHead eyebrow="Toujours" title="Repère permanent" sub="Commandes hebdomadaires sur les 90 derniers jours, indépendamment de la période choisie" />
            <Link href="/admin/analytique" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Explorateur</Link>
          </div>
          <div className="px-4 py-3">
            <AreaChart
              points={(() => {
                const ninety = new Date(requestNow() - 90 * 86_400_000);
                const weekly = new Map<string, number>();
                for (const p of bundle.orders) {
                  if (new Date(p.at) < ninety) continue;
                  const d = new Date(p.at);
                  const key = `S${Math.floor((d.getTime() - ninety.getTime()) / (7 * 86_400_000)) + 1}`;
                  weekly.set(key, (weekly.get(key) ?? 0) + p.value);
                }
                return [...weekly.entries()].map(([label, value]) => ({ label, value }));
              })()}
              height={150}
              tone="ink"
              format={{ kind: "count", suffixes: ["commande", "commandes"] }}
              ariaLabel="Commandes hebdomadaires"
              drill={{ href: "/admin/aujourdhui?jour={at}" }}
              showAxis
            />
            <p className="mt-1 text-[11px] text-os-faint">
              {period.label} en cours · période précédente {formatDay(prev.from)} – {formatDay(prev.to)} · l&apos;an dernier {formatDay(year.from)} – {formatDay(year.to)}
            </p>
          </div>
        </Sheet>
      </section>

      <Reveal className="mt-3 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-os-line bg-os-surface-2/50 px-4 py-3 text-[11px] text-os-muted">
          <span>
            Période {period.label.toLowerCase()} · {period.days} jour(s) · {counts.orders.toLocaleString("fr-TN")} commandes historiques dans le registre
          </span>
          <span className="flex flex-wrap items-center gap-3">
            <Link href={periodQuery("30d")} className="uppercase tracking-[0.12em] text-os-gold" prefetch={false}>30 derniers jours</Link>
            <Link href="/admin/echanges?kind=orders" className="uppercase tracking-[0.12em] text-os-gold">Exporter les données</Link>
            <Link href="/admin/systeme" className="uppercase tracking-[0.12em] text-os-gold">Diagnostic</Link>
          </span>
        </div>
      </Reveal>
    </div>
  );
}
