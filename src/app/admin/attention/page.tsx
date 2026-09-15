import Link from "next/link";
import { attentionQueue, periodStats } from "@/lib/admin/attention";
import { resolvePeriod } from "@/lib/admin/period";
import { systemCounts } from "@/lib/admin/metrics";
import { PeriodSwitch } from "@/components/admin/os/controls";
import { AlertLedger, PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { BarList } from "@/components/admin/os/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre d'attention" };

const GROUPS = [
  { key: "critical", label: "Critique", hint: "L'argent ou la relation est en jeu maintenant", tone: "bad" as const },
  { key: "high", label: "Élevé", hint: "À traiter dans la journée", tone: "warn" as const },
  { key: "normal", label: "Normal", hint: "À intégrer au travail de la semaine", tone: "neutral" as const },
];

/**
 * CENTRE D'ATTENTION
 *
 * Every row is a count read from a real ledger, with the objects it concerns
 * one click away. Nothing here is a badge without a door behind it.
 */
export default async function AttentionCentre({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const period = resolvePeriod({ p: flat.p ?? "30d", from: flat.from, to: flat.to });
  const [alerts, counts, stats] = await Promise.all([attentionQueue(), systemCounts(), periodStats(period)]);
  const bySeverity = (sev: string) => alerts.filter((a) => a.severity === sev);
  const exposed = alerts.reduce((a, x) => a + (x.amount ?? 0), 0);
  const worst = alerts.filter((a) => a.severity === "critical");

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Commandement · friction"
        icon="alert"
        title="Centre d'attention"
        sub="Trois gravités, aucune estimation : chaque ligne compte des objets réels (commandes, produits, clientes, lettres) et ouvre l'écran où l'action se fait."
        actions={<PeriodSwitch current={period.key} from={flat.from} to={flat.to} />}
      />

      <StatStrip
        items={[
          { label: "Points de friction", value: <AnimatedNumber value={alerts.length} />, sub: `${bySeverity("critical").length} critique(s)`, tone: alerts.length ? "warn" : "good" },
          { label: "Valeur exposée", value: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(exposed / 1000)} DT`, sub: "Somme des alertes portant un montant" },
          { label: "Commandes non réglées", value: <AnimatedNumber value={counts.orders_pending ?? 0} />, sub: `${stats.orders} commandes sur ${period.label.toLowerCase()}`, tone: "warn", href: "/admin/commandes?statut=pending" },
          { label: "Produits épuisés", value: <AnimatedNumber value={counts.products} />, sub: "voir le détail stock", href: "/admin/stock?bucket=rupture" },
        ]}
      />

      {worst.length > 0 && (
        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Sheet className="border-os-crit/40 bg-os-crit-soft/40">
            <p className="os-label text-os-crit">Priorité absolue</p>
            <ul className="mt-2 space-y-2">
              {worst.slice(0, 4).map((a) => (
                <li key={a.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-os-crit/20 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-os-text">{a.title}</p>
                    <p className="truncate text-[12px] text-os-muted">{a.detail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.amount ? <span className="os-num text-[12px] text-os-text">{new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(a.amount / 1000)} DT</span> : null}
                    <span className="os-num font-display text-[1.4rem] text-os-crit">{a.count}</span>
                    <Link href={a.href} className="bg-os-crit px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">{a.action}</Link>
                  </div>
                </li>
              ))}
            </ul>
          </Sheet>
          <Panel eyebrow="Charge par nature" title="Où l'effort se concentre" sub="Répartition des alertes ouvertes">
            <BarList
              rows={alerts.map((a) => ({ label: a.title, value: a.count, sub: a.detail.slice(0, 60), href: a.href }))}
              format={{ kind: "plain" }}
            />
          </Panel>
        </section>
      )}

      <div className="mt-3 space-y-3">
        {GROUPS.map((g) => {
          const rows = bySeverity(g.key);
          return (
            <Sheet key={g.key} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
                <p className="flex items-center gap-3">
                  <span className="os-label text-os-faint">{g.label}</span>
                  <Tag tone={g.tone}>{rows.length} point{rows.length > 1 ? "s" : ""}</Tag>
                </p>
                <p className="text-[11.5px] text-os-muted">{g.hint}</p>
              </div>
              <AlertLedger alerts={rows} empty={`Aucune friction de niveau ${g.label.toLowerCase()} dans les registres ouverts.`} />
            </Sheet>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel eyebrow="Méthode" title="Comment ces alertes sont calculées" className="lg:col-span-2">
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-os-muted">
            <li>· Une alerte naît d&apos;un <span className="text-os-text">compte réel</span> dans les registres : commandes, lignes de commande, mouvements de stock, avis, messages support, retours, lettres, listes d&apos;envie, abonnements.</li>
            <li>· Les seuils sont ceux de la maison : <span className="text-os-text">7 jours</span> pour une commande non expédiée, <span className="text-os-text">le seuil de réassort propre à chaque produit</span>, <span className="text-os-text">14 jours</span> avant l&apos;expiration d&apos;une promotion.</li>
            <li>· Les montants affichés sont des montants réels (valeur de commande, valeur de stock au prix de vente), jamais une projection.</li>
            <li>· Aucune alerte n&apos;est créée si le registre est vide : un écran vide est une information, pas un défaut.</li>
          </ul>
        </Panel>
        <Panel eyebrow="Actions" title="Traiter autrement" sub="Les mêmes registres, vus par leur usage">
          <ul className="space-y-1.5 text-[12.5px]">
            {[
              ["Aujourd'hui", "Chronologie du jour", "/admin/aujourdhui"],
              ["File de travail", "Ce qui est assigné", "/admin/taches"],
              ["Opportunités", "Ce que les données proposent", "/admin/opportunites"],
              ["Journal d'audit", "Qui a fait quoi", "/admin/journal"],
            ].map(([label, hint, href]) => (
              <li key={href}>
                <Link href={href} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft py-1.5 transition-colors hover:text-os-gold">
                  <span className="text-os-text">{label}</span>
                  <span className="text-os-faint">{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
