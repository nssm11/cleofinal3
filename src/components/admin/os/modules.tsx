import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Alert, Opportunity } from "@/lib/admin/attention";
import type { TimelineEvent } from "@/lib/admin/insights";
import { Glyph, type IconKey } from "./icons";
import { EmptyState, Metric, Money, SectionHead, Sheet, Tag } from "./primitives";
import { AnimatedNumber } from "./motion";

/* ══════════════════════════════════════════════════════════════════════════
   MODULES PARTAGÉS
   ──────────────────────────────────────────────────────────────────────────
   The pieces every workspace repeats — an opening, a ledger of friction, a
   stream of events. Shared so that a page written in an afternoon still obeys
   the same rules as the command centre.
   ══════════════════════════════════════════════════════════════════════════ */

export function PageHead({
  eyebrow, title, sub, actions, aside, tone = "plain", icon,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  tone?: "plain" | "dark";
  icon?: IconKey;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-5 pb-4 pt-5", tone === "dark" && "text-os-onink")}>
      <div className="min-w-0">
        <p className={cn("os-label flex items-center gap-2", tone === "dark" ? "text-os-onink-muted" : "text-os-faint")}>
          {icon && <Glyph name={icon} size={13} />}
          {eyebrow}
        </p>
        <h1 className={cn("mt-1.5 font-display text-[clamp(1.5rem,3.2vw,2.35rem)] leading-[1.02] tracking-tight", tone === "dark" ? "text-os-onink" : "text-os-text")}>
          {title}
        </h1>
        {sub && <p className={cn("mt-2 max-w-3xl text-[13px] leading-relaxed", tone === "dark" ? "text-os-onink-muted" : "text-os-muted")}>{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
      {aside}
    </header>
  );
}

export function StatStrip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "gold"; href?: string; delta?: ReactNode }[] }) {
  return (
    <div className="grid gap-px overflow-hidden border border-os-line bg-os-line sm:grid-cols-2 xl:grid-cols-4">
      {items.map((i) => {
        const body = (
          <div className="h-full bg-os-surface px-4 py-3.5 transition-colors hover:bg-os-surface-2/60">
            <p className="os-label text-os-muted">{i.label}</p>
            <p className={cn("os-num mt-1.5 font-display text-[1.7rem] leading-none",
              i.tone === "bad" ? "text-os-crit" : i.tone === "warn" ? "text-os-warn" : i.tone === "good" ? "text-os-ok" : i.tone === "gold" ? "text-os-gold-2" : "text-os-text")}>
              {i.value}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {i.delta}
              {i.sub && <span className="text-[11px] leading-tight text-os-muted">{i.sub}</span>}
            </div>
          </div>
        );
        return i.href ? <Link key={i.label} href={i.href} className="block">{body}</Link> : <div key={i.label}>{body}</div>;
      })}
    </div>
  );
}

const SEVERITY: Record<string, { tone: "bad" | "warn" | "neutral"; label: string; bar: string }> = {
  critical: { tone: "bad", label: "Critique", bar: "bg-os-crit" },
  high: { tone: "warn", label: "Élevé", bar: "bg-os-warn" },
  normal: { tone: "neutral", label: "Normal", bar: "bg-os-line-strong" },
};

export function AlertLedger({ alerts, empty = "Aucune friction détectée sur les registres.", compact = false }: { alerts: Alert[]; empty?: string; compact?: boolean }) {
  if (alerts.length === 0) return <div className="p-4"><EmptyState title="Rien à traiter" why={empty} /></div>;
  return (
    <ul className="divide-y divide-os-line-soft">
      {alerts.map((a) => {
        const sev = SEVERITY[a.severity] ?? SEVERITY.normal;
        return (
          <li key={a.key} className="group relative flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-os-surface-2/60">
            <span className={cn("absolute left-0 top-0 h-full w-[3px]", sev.bar)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-[13.5px] text-os-text">{a.title}</span>
                <Tag tone={sev.tone}>{sev.label}</Tag>
                {a.amount ? <span className="os-num text-[12px] text-os-muted"><Money millimes={a.amount} /></span> : null}
              </p>
              <p className="mt-0.5 text-[12px] text-os-muted">{a.detail}</p>
              {!compact && a.items?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {a.items.slice(0, 6).map((i) => (
                    <li key={`${i.href}-${i.label}`}>
                      <Link href={i.href} className="inline-flex items-center gap-1.5 border border-os-line bg-os-surface-2/70 px-2 py-0.5 text-[11px] text-os-text transition-colors hover:border-os-line-strong hover:bg-os-surface">
                        {i.label}
                        {i.sub && <span className="text-os-faint">{i.sub}</span>}
                        {i.value != null && <span className="os-num text-os-muted"><Money millimes={i.value} /></span>}
                      </Link>
                    </li>
                  ))}
                  {a.items.length > 6 && <li className="self-center text-[11px] text-os-faint">+ {a.items.length - 6} autres</li>}
                </ul>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="os-num w-9 text-right font-display text-[1.35rem] leading-none text-os-text">{a.count}</span>
              <Link
                href={a.href}
                className="border border-os-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-text transition-colors group-hover:border-os-ink group-hover:bg-os-ink group-hover:text-os-onink"
              >
                {a.action}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OpportunityLedger({ items, columns = 2 }: { items: Opportunity[]; columns?: 1 | 2 | 3 }) {
  if (items.length === 0) return <div className="p-4"><EmptyState title="Aucun signal exploitable" why="Les indicateurs de désir, de paniers et de réassort sont silencieux : la base ne contient pas encore assez de mouvement." /></div>;
  return (
    <ul className={cn("grid gap-px bg-os-line", columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
      {items.map((o) => (
        <li key={o.key} className="bg-os-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13.5px] text-os-text">{o.title}</p>
            <Tag tone={o.severity === "chaud" ? "bad" : o.severity === "tiede" ? "warn" : "neutral"}>{o.severity}</Tag>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-os-muted">{o.detail}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            {o.evidence.map((e) => (
              <div key={e.label} className="flex items-baseline justify-between gap-2 border-b border-dashed border-os-line-soft pb-0.5">
                <dt className="truncate text-os-faint">{e.label}</dt>
                <dd className="os-num shrink-0 text-os-text">{e.value}</dd>
              </div>
            ))}
          </dl>
          <p className="os-label mt-2 text-os-faint">{o.metricLabel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href={o.href} className="inline-flex items-center gap-1.5 bg-os-ink px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-onink transition-opacity hover:opacity-90">
              {o.action} <Glyph name="arrowRight" size={12} />
            </Link>
            {o.secondary?.map((s) => (
              <Link key={s.href} href={s.href} className="border border-os-line px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-os-muted transition-colors hover:text-os-text">
                {s.label}
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

const TONE_DOT: Record<string, string> = { bad: "bg-os-crit", warn: "bg-os-warn", good: "bg-os-ok", neutral: "bg-os-line-strong" };

export function EventStream({ events, showDay = false, dense = false }: { events: TimelineEvent[]; showDay?: boolean; dense?: boolean }) {
  if (events.length === 0) return <div className="p-4"><EmptyState title="Aucun événement" why="Rien n'a été enregistré dans cette fenêtre. Élargissez la période ou changez de nature." /></div>;
  const dayFmt = new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long" });
  const days = events.map((e) => dayFmt.format(e.at));
  return (
    <ol className="relative">
      <span className="absolute left-[5.4rem] top-3 bottom-3 w-px bg-os-line" aria-hidden />
      {events.map((e, i) => {
        const day = days[i];
        const newDay = showDay && (i === 0 || day !== days[i - 1]);
        return (
          <li key={e.key}>
            {newDay && (
              <p className="sticky top-0 z-10 flex items-center gap-3 bg-os-surface/95 px-4 py-1.5 backdrop-blur">
                <span className="os-label text-os-faint">{day}</span>
                <span className="h-px flex-1 bg-os-line" aria-hidden />
              </p>
            )}
            <div className={cn("relative flex gap-3 px-4", dense ? "py-1.5" : "py-2.5")}>
              <span className="os-num w-12 shrink-0 pt-0.5 text-right text-[11px] text-os-faint">
                {new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" }).format(e.at)}
              </span>
              <span className={cn("relative mt-1 h-2 w-2 shrink-0 rounded-full", TONE_DOT[e.tone] ?? TONE_DOT.neutral)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-os-text">
                  {e.href ? <Link href={e.href} className="transition-colors hover:text-os-gold">{e.title}</Link> : e.title}
                </p>
                <p className="truncate text-[11.5px] text-os-muted">
                  {e.detail ?? ""}
                  {e.actor ? ` · ${e.actor}` : ""}
                </p>
              </div>
              {e.value != null && <span className="os-num shrink-0 self-center text-[12px] text-os-muted">{new Intl.NumberFormat("fr-TN").format(e.value)}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Panel({ eyebrow, title, sub, action, children, padded = true, className }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; padded?: boolean; className?: string }) {
  return (
    <Sheet padded={false} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
        <SectionHead eyebrow={eyebrow} title={title} sub={sub} />
        {action}
      </div>
      <div className={padded ? "px-4 py-3.5" : undefined}>{children}</div>
    </Sheet>
  );
}

export function CountMeter({ label, count, total, tone = "gold", href, hint }: { label: string; count: number; total: number; tone?: "gold" | "warn" | "bad" | "ok" | "ink"; href?: string; hint?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const bar = tone === "bad" ? "bg-os-crit" : tone === "warn" ? "bg-os-warn" : tone === "ok" ? "bg-os-ok" : tone === "ink" ? "bg-os-ink" : "bg-os-gold";
  const inner = (
    <div className="group">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-os-text">{label}</span>
        <span className="os-num text-[12.5px] text-os-text">
          <AnimatedNumber value={count} />
          <span className="ml-1.5 text-[11px] text-os-faint">{pct} %</span>
        </span>
      </div>
      <div className="mt-1.5 h-[5px] w-full bg-os-surface-3">
        <div className={cn("h-full transition-[width] duration-500", bar)} style={{ width: `${pct}%` }} />
      </div>
      {hint && <p className="mt-1 text-[11px] text-os-faint">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block transition-opacity hover:opacity-85">{inner}</Link> : inner;
}

export function TinyStat({ label, value, sub, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "gold" }) {
  return <Metric label={label} value={value} size="sm" tone={tone} sub={sub} />;
}
