"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { osMicro } from "@/lib/admin/motion";
import { CalendarIcon, CloseIcon, RefreshIcon } from "./icons";
import { OsButton } from "./primitives";

/* ══════════════════════════════════════════════════════════════════════════
   COMMANDES DE LECTURE
   ──────────────────────────────────────────────────────────────────────────
   Time, metric, comparison, refresh. These four are the same everywhere in the
   instrument and they are always in the same corner of the screen, so an
   operator's hand learns them once.
   ══════════════════════════════════════════════════════════════════════════ */

function useQueryPush(basePath: string) {
  const router = useRouter();
  const params = useSearchParams();
  return useCallback(
    (patch: Record<string, string | number | null | undefined>, reset: string[] = []) => {
      const next = new URLSearchParams(params.toString());
      for (const key of reset) next.delete(key);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      const qs = next.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, params, router],
  );
}

const PERIODS: { key: string; label: string; full: string }[] = [
  { key: "today", label: "Auj.", full: "Aujourd'hui" },
  { key: "7d", label: "7 j", full: "Sept jours" },
  { key: "30d", label: "30 j", full: "Trente jours" },
  { key: "90d", label: "90 j", full: "Quatre-vingt-dix jours" },
  { key: "year", label: "Année", full: "Année en cours" },
  { key: "custom", label: "Dates", full: "Période personnalisée" },
];

export function PeriodSwitch({ basePath = "", current = "30d", from, to, className }: { basePath?: string; current?: string; from?: string; to?: string; className?: string }) {
  const push = useQueryPush(basePath);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState({ from: from ?? "", to: to ?? "" });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrap} className={cn("relative inline-flex items-center", className)}>
      <div className="inline-flex border border-os-line bg-os-surface" role="group" aria-label="Période">
        {PERIODS.map((p) => {
          const active = current === p.key;
          return (
            <button
              key={p.key}
              onClick={() => (p.key === "custom" ? setOpen(true) : push({ p: p.key }, ["from", "to"]))}
              aria-pressed={active}
              title={p.full}
              className={cn(
                "relative px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                active ? "bg-os-ink text-os-onink" : "text-os-muted hover:bg-os-surface-2 hover:text-os-text",
                p.key === "custom" && active && "text-os-gold",
              )}
            >
              {p.key === "custom" && <CalendarIcon size={12} className="mr-1 inline align-[-2px]" />}
              {p.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={osMicro}
            className="absolute right-0 top-[calc(100%+6px)] z-40 w-72 border border-os-line-strong bg-os-surface p-3 shadow-os-lift"
          >
            <p className="os-label mb-2 text-os-muted">Période personnalisée</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="os-label text-os-faint">Du</span>
                <input type="date" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[12px] text-os-text" />
              </label>
              <label className="block">
                <span className="os-label text-os-faint">Au</span>
                <input type="date" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[12px] text-os-text" />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => { const d = new Date(); const s = new Date(d.getTime() - 29 * 86_400_000); setDraft({ from: s.toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) }); }} className="text-[11px] text-os-muted underline">
                30 derniers jours
              </button>
              <div className="flex gap-1.5">
                <OsButton size="sm" variant="quiet" onClick={() => setOpen(false)}>Annuler</OsButton>
                <OsButton size="sm" variant="primary" onClick={() => { push({ p: "custom", from: draft.from, to: draft.to }); setOpen(false); }} disabled={!draft.from || !draft.to}>
                  Appliquer
                </OsButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MetricSwitch({ basePath = "", current, metrics, className }: { basePath?: string; current: string; metrics: { key: string; label: string }[]; className?: string }) {
  const push = useQueryPush(basePath);
  return (
    <div className={cn("inline-flex flex-wrap border border-os-line bg-os-surface", className)} role="group" aria-label="Mesure">
      {metrics.map((m) => {
        const active = current === m.key;
        return (
          <button
            key={m.key}
            onClick={() => push({ m: m.key })}
            aria-pressed={active}
            className={cn(
              "px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
              active ? "bg-os-gold-soft text-os-gold-2" : "text-os-muted hover:bg-os-surface-2 hover:text-os-text",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function CompareToggle({ basePath = "", on, label = "Comparer" }: { basePath?: string; on: boolean; label?: string }) {
  const push = useQueryPush(basePath);
  return (
    <button
      onClick={() => push({ cmp: on ? "0" : "1" })}
      aria-pressed={on}
      className={cn("flex items-center gap-2 border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors", on ? "border-os-line-strong bg-os-surface text-os-text" : "border-os-line text-os-muted hover:text-os-text")}
    >
      <span className={cn("h-2.5 w-2.5 border", on ? "border-os-ink bg-os-ink" : "border-os-line-strong")} aria-hidden />
      {label}
    </button>
  );
}

/** A refresh that tells you when it last ran — no silent staleness. */
export function RefreshControl({ intervalSeconds, label = "Actualiser" }: { intervalSeconds?: number; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState<Date | null>(null);
  const [auto, setAuto] = useState(Boolean(intervalSeconds));
  const reduce = useReducedMotion();

  const run = useCallback(() => {
    setBusy(true);
    router.refresh();
    setTimeout(() => { setBusy(false); setAt(new Date()); }, 550);
  }, [router]);

  useEffect(() => {
    if (!intervalSeconds || !auto) return;
    const id = setInterval(run, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [intervalSeconds, auto, run]);

  return (
    <div className="flex items-center gap-2">
      <button onClick={run} className="flex items-center gap-1.5 border border-os-line px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-muted transition-colors hover:text-os-text" title="Recharger les données">
        <motion.span animate={busy && !reduce ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.6, ease: "linear" }}>
          <RefreshIcon size={13} />
        </motion.span>
        {label}
      </button>
      {intervalSeconds ? (
        <button onClick={() => setAuto((a) => !a)} className={cn("flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]", auto ? "text-os-ok" : "text-os-faint")} title={auto ? "Diffusion automatique activée" : "Diffusion automatique en pause"}>
          <span className={cn("h-1.5 w-1.5 rounded-full", auto ? "bg-os-ok os-live" : "bg-os-faint")} aria-hidden />
          {auto ? "en direct" : "en pause"}
        </button>
      ) : null}
      {at && <span className="os-num hidden text-[10px] text-os-faint sm:inline">{new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(at)}</span>}
    </div>
  );
}

/** Segmented control for in-page mode switches (tabs, views, dimensions). */
export function Segmented<T extends string>({ value, onChange, options, size = "md", className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; hint?: string; count?: number }[]; size?: "sm" | "md"; className?: string }) {
  return (
    <div className={cn("inline-flex flex-wrap border border-os-line bg-os-surface", className)} role="group">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.hint}
            aria-pressed={active}
            className={cn(
              size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
              "font-semibold uppercase tracking-[0.1em] transition-colors",
              active ? "bg-os-ink text-os-onink" : "text-os-muted hover:bg-os-surface-2 hover:text-os-text",
            )}
          >
            {o.label}
            {o.count != null && <span className={cn("os-num ml-1.5", active ? "text-os-gold" : "text-os-faint")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Small inline disclosure used inside panels. */
export function InlineDisclosure({ summary, children, defaultOpen = false }: { summary: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  return (
    <div className="border-t border-os-line-soft first:border-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 py-2 text-left text-[12px] text-os-muted hover:text-os-text">
        <span>{summary}</span>
        <motion.span animate={reduce ? undefined : { rotate: open ? 180 : 0 }} transition={osMicro} className="text-os-faint">⌄</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={osMicro} className="overflow-hidden">
            <div className="pb-3 text-[12px] text-os-muted">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Chip used by the global filter system; removable, never decorative. */
export function FilterChip({ label, value, onClear, tone = "neutral" }: { label: string; value: string; onClear?: () => void; tone?: "neutral" | "gold" | "crit" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px]", tone === "gold" ? "border-os-gold/40 bg-os-gold-soft text-os-gold-2" : tone === "crit" ? "border-os-crit/30 bg-os-crit-soft text-os-crit" : "border-os-line bg-os-surface-2 text-os-muted")}>
      <span className="os-label">{label}</span>
      <span className="text-os-text">{value}</span>
      {onClear && (
        <button onClick={onClear} aria-label={`Retirer le filtre ${label}`} className="text-os-faint hover:text-os-text">
          <CloseIcon size={11} />
        </button>
      )}
    </span>
  );
}
