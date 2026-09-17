import type { ReactNode } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   CHROME DES ÉCRANS SECONDAIRES
   ──────────────────────────────────────────────────────────────────────────
   The secondary screens share one bright, quiet chrome — the same ivory
   sheets, stone hairlines and ink as the instrument, so a page opened from
   the dashboard reads as the same room.
   ══════════════════════════════════════════════════════════════════════════ */

// Page shell
export function AdminPage({ title, sub, action, children, eyebrow }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; eyebrow?: string }) {
  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-os-line pb-5 pt-2">
        <div>
          {eyebrow && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-os-gold">{eyebrow}</p>}
          <h1 className="font-sans text-[1.9rem] leading-none tracking-tight text-os-text">{title}</h1>
          {sub && <p className="mt-2 text-[13px] text-os-muted">{sub}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <div className={cn("border border-os-line bg-os-surface shadow-os-sheet", className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-os-line px-5 py-3.5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-os-muted">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// Data table — dense but legible
export function Table({ head, children, minWidth = "min-w-[720px]" }: { head: ReactNode[]; children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto border border-os-line bg-os-surface">
      <table className={cn("w-full border-collapse text-[13px]", minWidth)}>
        <thead>
          <tr className="border-b border-os-line text-left text-[10px] font-bold uppercase tracking-[0.16em] text-os-muted">
            {head.map((h, i) => <th key={i} className="px-4 py-3 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-os-line-soft">{children}</tbody>
      </table>
    </div>
  );
}

// Status badge — the maison's own semantic voices
const tones: Record<OrderStatus, string> = {
  pending: "bg-amber-wash text-amber", confirmed: "bg-iodine-wash text-iodine", preparing: "bg-iodine-wash text-iodine",
  shipped: "bg-canvas-2 text-steel", delivered: "bg-ok-wash text-ok", cancelled: "bg-crit-wash text-crit", returned: "bg-crit-wash text-crit",
};
export function StatusBadge({ s, className }: { s: OrderStatus; className?: string }) {
  return <span className={cn("inline-flex whitespace-nowrap px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", tones[s], className)}>{ORDER_STATUS_LABELS[s]}</span>;
}

// KPIs — editorial, not dashboard-y
export function KPI({ label, value, sub, tone = "text-os-text" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="relative overflow-hidden border border-os-line bg-os-surface px-5 py-6 shadow-os-sheet">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-iodine-deep" />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-os-muted">{label}</p>
      <p className={cn("mt-3 font-sans text-[2rem] leading-none tracking-tight", tone)}>{value}</p>
      {sub && <p className="mt-2 text-xs text-os-muted">{sub}</p>}
    </div>
  );
}

// Inputs — bright fields, ink primary
export const afield = "w-full min-h-11 border border-os-line bg-canvas px-3.5 py-2 text-sm text-os-text placeholder:text-os-faint focus:border-os-gold focus:outline-none focus:ring-1 focus:ring-os-gold/30 transition-colors";
export const abtn = "inline-flex min-h-11 items-center justify-center gap-2 bg-os-ink px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-os-onink transition-colors hover:bg-os-ink-2 disabled:opacity-40";
export const abtnGhost = "inline-flex min-h-11 items-center justify-center gap-2 border border-os-line bg-transparent px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-os-text transition-colors hover:border-os-line-strong hover:bg-os-surface-2 disabled:opacity-40";
export const abtnDanger = "inline-flex min-h-11 items-center justify-center gap-2 border border-crit/50 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-crit transition-colors hover:bg-crit-wash disabled:opacity-40";

export function AField({ label, children, error, hint }: { label: string; children: ReactNode; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-os-muted">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-os-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-crit" role="alert">{error}</span>}
    </label>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-os-muted", className)}>{children}</h2>;
}
