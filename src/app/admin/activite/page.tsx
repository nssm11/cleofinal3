import Link from "next/link";
import { systemCounts } from "@/lib/admin/metrics";
import { hourlyCounts, timeline, timelineCounts, TIMELINE_KINDS, type TimelineKind } from "@/lib/admin/insights";
import { RefreshControl } from "@/components/admin/os/controls";
import { EventStream, PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { AreaChart } from "@/components/admin/os/charts";
import { Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activité en direct" };

const WINDOWS = [
  { key: "24", label: "24 heures" },
  { key: "72", label: "3 jours" },
  { key: "168", label: "7 jours" },
] as const;

/**
 * ACTIVITÉ EN DIRECT
 *
 * The house's heartbeat: every entry is an insert in a ledger, streamed with
 * restraint. No toast, no bell — a calm column you can leave open beside your
 * work, and an easterly wind of counters above it.
 */
export default async function LiveActivity({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const hours = WINDOWS.some((w) => w.key === flat.h) ? Number(flat.h) : 24;
  const kinds = (flat.kinds ? String(flat.kinds).split(",") : []).filter((k): k is TimelineKind => TIMELINE_KINDS.some((t) => t.key === k));
  const to = new Date();
  const from = new Date(to.getTime() - hours * 3_600_000);

  const [events, counts, system, hourly] = await Promise.all([
    timeline({ from, to, kinds: kinds.length ? kinds : undefined, limit: 300 }),
    timelineCounts(from, to),
    systemCounts(),
    hourlyCounts(from, to),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const perHour = total / hours;

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Commandement · battement"
        icon="pulse"
        title="Activité en direct"
        sub="Tout ce que la maison enregistre — commandes, paiements, stock, clientes, avis, support, retours, lettres, fidélité, recherches, administration — rangé par heure réelle."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex border border-os-line bg-os-surface">
              {WINDOWS.map((w) => (
                <Link key={w.key} href={`/admin/activite?h=${w.key}${kinds.length ? `&kinds=${kinds.join(",")}` : ""}`} className={cn("px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]", hours === Number(w.key) ? "bg-os-ink text-os-onink" : "text-os-muted hover:text-os-text")}>
                  {w.label}
                </Link>
              ))}
            </div>
            <RefreshControl intervalSeconds={30} label="Actualiser" />
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Événements sur la fenêtre", value: <AnimatedNumber value={total} />, sub: `${perHour.toFixed(1)} par heure en moyenne` },
          { label: "Commandes", value: <AnimatedNumber value={counts.order ?? 0} />, sub: `dont ${counts.payment ?? 0} mouvement(s) de paiement`, href: "/admin/commandes" },
          { label: "Lettres", value: <AnimatedNumber value={counts.email ?? 0} />, sub: `${system.emails_failed ?? 0} en échec au total`, tone: (system.emails_failed ?? 0) > 0 ? "warn" : "good", href: "/admin/emails" },
          { label: "Recherches", value: <AnimatedNumber value={counts.search ?? 0} />, sub: "demande exprimée en clair", href: "/admin/recherches" },
        ]}
      />

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Sheet padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <div>
              <p className="os-label text-os-faint">Fil</p>
              <h2 className="mt-1 font-display text-[1.35rem] text-os-text">Chronologie en direct</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TIMELINE_KINDS.filter((k) => (counts[k.key] ?? 0) > 0).map((k) => {
                const active = kinds.includes(k.key);
                const next = active ? kinds.filter((x) => x !== k.key) : [...kinds, k.key];
                return (
                  <Link key={k.key} href={`/admin/activite?h=${hours}${next.length ? `&kinds=${next.join(",")}` : ""}`} className={cn("border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]", active ? "border-os-gold bg-os-gold-soft text-os-gold-2" : "border-os-line text-os-muted hover:text-os-text")}>
                    {k.label} <span className="os-num">{counts[k.key]}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="max-h-[44rem] overflow-y-auto os-scroll">
            <EventStream events={events} showDay={hours > 24} />
          </div>
        </Sheet>

        <div className="grid gap-3">
          <Panel eyebrow="Densité" title="Événements par heure" sub={`${hours} heures glissantes`} padded={false}>
            <div className="px-4 py-3">
              <AreaChart
                points={hourlySeries(from, to, hourly)}
                height={140}
                tone="info"
                format={{ kind: "count", suffixes: ["événement", "événements"] }}
                ariaLabel="Événements par heure"
                showAxis={hours <= 24}
              />
            </div>
          </Panel>

          <Panel eyebrow="Répartition" title="Par nature" sub="Fenêtre courante">
            <ul className="space-y-1.5">
              {TIMELINE_KINDS.map((k) => {
                const n = counts[k.key] ?? 0;
                const pct = total ? (n / total) * 100 : 0;
                return (
                  <li key={k.key}>
                    <div className="flex items-baseline justify-between gap-3 text-[12px]">
                      <span className="text-os-muted">{k.label}</span>
                      <span className="os-num text-os-text">{n}</span>
                    </div>
                    <div className="mt-1 h-[4px] w-full bg-os-surface-3">
                      <div className="h-full bg-os-ink/70" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel eyebrow="Note de méthode" title="Pourquoi aucun son" sub="Rien ne clignote ici par principe">
            <p className="text-[12.5px] leading-relaxed text-os-muted">
              L&apos;activité se lit, elle n&apos;interrompt pas. Les compteurs se rafraîchissent à la demande ou toutes les 30 secondes si vous l&apos;activez, et seuls les
              changements de statut réels apparaissent. Un afflux d&apos;événements peut être filtré par nature, par fenêtre, ou simplement ignoré — le registre reste.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag tone="info">diffusion à la demande</Tag>
              <Tag tone="neutral">aucune notification intempestive</Tag>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

/**
 * The hour axis is the ledger's own: one value per hour that actually holds
 * events, all others at zero. No interpolation, no smoothing.
 */
function hourlySeries(from: Date, to: Date, hourly: { at: Date; n: number }[]) {
  const key = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
  const map = new Map(hourly.map((h) => [key(h.at), h.n]));
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), from.getHours());
  const hours = Math.min(168, Math.ceil((to.getTime() - start.getTime()) / 3_600_000));
  return Array.from({ length: hours }, (_, i) => {
    const at = new Date(start.getTime() + i * 3_600_000);
    return { label: `${String(at.getHours()).padStart(2, "0")}h`, value: map.get(key(at)) ?? 0, at: at.toISOString() };
  });
}
