"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ eyebrow, title, sub, action, children, padded = true, className }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; padded?: boolean; className?: string }) {
  return (
    <section className={cn("border border-line bg-bg", className)}>
      {(eyebrow || title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>}
            <h3 className="font-sans text-[14px] font-semibold">{title}</h3>
            {sub && <p className="mt-1 font-sans text-[12px] text-text-secondary">{sub}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(padded && "p-4")}>{children}</div>
    </section>
  );
}

export function StatStrip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; tone?: any; href?: string; delta?: ReactNode }[] }) {
  return (
    <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => {
        const content = (
          <div className="bg-bg p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{it.label}</p>
            <p className="mt-2 font-sans text-[18px] font-semibold">{it.value}</p>
            {it.sub && <p className="mt-1 font-mono text-[11px] text-text-muted">{it.sub}</p>}
          </div>
        );
        return it.href ? <Link key={i} href={it.href} className="block hover:bg-bg-2">{content}</Link> : <div key={i}>{content}</div>;
      })}
    </div>
  );
}

export function TinyStat({ label, value, sub, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: any }) {
  return <div className="border border-line bg-bg p-3"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</p><p className="mt-2 font-sans text-[16px] font-semibold">{value}</p>{sub && <p className="mt-1 font-mono text-[11px] text-text-muted\">{sub}</p>}</div>;
}

export function CountMeter({ label, count, total, tone = "gold", href, hint }: { label: string; count: number; total: number; tone?: any; href?: string; hint?: string }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div className="border border-line bg-bg p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-2 font-mono text-[13px]">{count} / {total} — {pct.toFixed(0)}%</p>
      <div className="mt-2 h-[2px] w-full bg-line"><div className="h-full bg-ink" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function AlertLedger({ alerts, empty = "Aucune friction.", compact = false }: { alerts: any[]; empty?: string; compact?: boolean }) {
  if (!alerts.length) return <p className="font-mono text-[11px] text-text-muted border border-dashed border-line p-4">{empty}</p>;
  return (
    <ul className="divide-y divide-line border border-line">
      {alerts.map((a, i) => (
        <li key={i} className="p-3 font-mono text-[12px]"><span className="font-semibold">{a.title ?? a.kind}</span> — {a.detail ?? a.message}</li>
      ))}
    </ul>
  );
}

export function OpportunityLedger({ items, columns = 2 }: { items: any[]; columns?: 1 | 2 | 3 }) {
  return <div className="grid gap-px bg-line border border-line" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>{items.map((it, i) => <div key={i} className="bg-bg p-4 font-sans text-[13px]">{it.title ?? it.label}</div>)}</div>;
}

export function PageHead({ eyebrow, title, sub, action, kicker, icon, actions, children, ...rest }: { eyebrow?: string; title: any; sub?: any; action?: any; kicker?: string; icon?: any; actions?: any; children?: any; [key: string]: any }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {(eyebrow || kicker) && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{eyebrow ?? kicker}</p>}
        <h1 className="mt-2 font-sans text-[28px] font-bold tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-2 max-w-[60ch] font-sans text-[13px] text-text-secondary\">{sub}</p>}
        {children}
      </div>
      {(action || actions) && <div className="flex gap-2">{action ?? actions}</div>}
    </div>
  );
}

export function EventStream({ events, showDay = false, dense = false }: { events: any[]; showDay?: boolean; dense?: boolean }) {
  return (
    <ul className="divide-y divide-line border border-line">
      {events.map((e, i) => (
        <li key={i} className="p-3 flex gap-3"><span className="font-mono text-[10px] text-text-muted">{e.at ?? e.time}</span><span className="font-sans text-[12px]">{e.label ?? e.title}</span></li>
      ))}
    </ul>
  );
}

export function ResendLetter({ id, kind, status, subject, to, at, error }: { id: number; kind: string; status: string; subject: string; to: string; at: string | null; error: string | null }) {
  return <div className="border border-line p-3 font-mono text-[11px]"><p>{subject} → {to}</p><p className="text-text-muted">{status} {at}</p>{error && <p className="text-error">{error}</p>}</div>;
}
