"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OsButton } from "./primitives";

function useQueryPush(basePath: string) {
  const router = useRouter();
  const params = useSearchParams();
  return useCallback((patch: Record<string, string | number | null | undefined>, reset: string[] = []) => {
    const next = new URLSearchParams(params.toString());
    for (const key of reset) next.delete(key);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }, [basePath, params, router]);
}

const PERIODS = [
  { key: "today", label: "Auj." },
  { key: "7d", label: "7 j" },
  { key: "30d", label: "30 j" },
  { key: "90d", label: "90 j" },
  { key: "year", label: "Année" },
  { key: "custom", label: "Dates" },
];

export function PeriodSwitch({ basePath = "", current = "30d", from, to, className }: { basePath?: string; current?: string; from?: string; to?: string; className?: string }) {
  const push = useQueryPush(basePath);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: from ?? "", to: to ?? "" });
  return (
    <div className={cn("relative inline-flex", className)}>
      <div className="inline-flex border border-line bg-bg">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => (p.key === "custom" ? setOpen(true) : push({ p: p.key }, ["from", "to"]))} className={cn("px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em]", current === p.key ? "bg-ink text-paper" : "text-text-muted hover:text-ink")}>{p.label}</button>
        ))}
      </div>
      {open && (
        <div className="absolute right-0 top-[100%] z-40 mt-1 w-64 border border-line bg-bg p-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className="h-9 border border-line px-2 text-[12px]" />
            <input type="date" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="h-9 border border-line px-2 text-[12px]" />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <OsButton size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</OsButton>
            <OsButton size="sm" variant="primary" onClick={() => { push({ p: "custom", from: draft.from, to: draft.to }); setOpen(false); }}>OK</OsButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricSwitch({ basePath = "", current, metrics, className }: { basePath?: string; current: string; metrics: { key: string; label: string }[]; className?: string }) {
  const push = useQueryPush(basePath);
  return (
    <div className={cn("inline-flex border border-line bg-bg", className)}>
      {metrics.map((m) => (
        <button key={m.key} onClick={() => push({ m: m.key })} className={cn("px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em]", current === m.key ? "bg-ink text-paper" : "text-text-muted")}>{m.label}</button>
      ))}
    </div>
  );
}

export function CompareToggle({ basePath = "", on, label = "Comparer" }: { basePath?: string; on: boolean; label?: string }) {
  const push = useQueryPush(basePath);
  return <button onClick={() => push({ cmp: on ? "0" : "1" })} className={cn("border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em]", on ? "border-ink bg-ink text-paper" : "border-line text-text-muted")}>{label}</button>;
}

export function RefreshControl({ intervalSeconds, label = "Actualiser" }: { intervalSeconds?: number; label?: string }) {
  const router = useRouter();
  return <button onClick={() => router.refresh()} className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em]">{label}</button>;
}

export function Segmented<T extends string>({ value, onChange, options, size = "md", className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; hint?: string; count?: number }[]; size?: "sm" | "md"; className?: string }) {
  return (
    <div className={cn("inline-flex border border-line bg-bg", className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn("px-3 font-mono text-[11px] uppercase tracking-[0.06em]", size === "sm" ? "py-1" : "py-2", value === o.value ? "bg-ink text-paper" : "text-text-muted")}>{o.label}{o.count != null && <span className="ml-1">({o.count})</span>}</button>
      ))}
    </div>
  );
}

export function InlineDisclosure({ summary, children, defaultOpen = false }: { summary: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line py-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full justify-between text-left font-mono text-[11px] uppercase tracking-[0.06em]">{summary}<span>{open ? "−" : "+"}</span></button>
      {open && <div className="pt-2 text-[12px] text-text-secondary">{children}</div>}
    </div>
  );
}

export function FilterChip({ label, value, onClear, tone = "neutral" }: { label: string; value: string; onClear?: () => void; tone?: "neutral" | "gold" | "crit" }) {
  return (
    <span className="inline-flex items-center gap-2 border border-line bg-bg-2 px-2 py-1 font-mono text-[11px]">
      <span className="text-text-muted">{label}</span><span>{value}</span>{onClear && <button onClick={onClear}>×</button>}
    </span>
  );
}
