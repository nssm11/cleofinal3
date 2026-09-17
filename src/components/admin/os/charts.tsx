"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { osMicro, osStandard } from "@/lib/admin/motion";
import { makeFormat, type FormatSpec } from "./format";

/* ══════════════════════════════════════════════════════════════════════════
   GRAPHIQUES — hand-drawn SVG instruments
   ──────────────────────────────────────────────────────────────────────────
   Written rather than imported for one reason: a generic chart library looks
   generic. These carry the house's own type, rules and champagne ink, animate
   the way the rest of the interface moves, and expose a keyboard cursor so the
   figures are readable without a mouse.

   Every chart takes the same shape — `{ label, value }[]` — and every one
   degrades honestly when the data is thin (a single point draws a rule, not a
   fake line).
   ══════════════════════════════════════════════════════════════════════════ */

export type Point = { label: string; value: number; at?: string };
export type { FormatSpec };


const TONES: Record<string, { line: string; fill: string; soft: string }> = {
  gold: { line: "var(--color-os-gold)", fill: "color-mix(in oklab, var(--color-os-gold) 26%, transparent)", soft: "color-mix(in oklab, var(--color-os-gold) 10%, transparent)" },
  ink: { line: "var(--color-os-ink)", fill: "color-mix(in oklab, var(--color-os-ink) 18%, transparent)", soft: "color-mix(in oklab, var(--color-os-ink) 7%, transparent)" },
  ok: { line: "var(--color-os-ok)", fill: "color-mix(in oklab, var(--color-os-ok) 22%, transparent)", soft: "color-mix(in oklab, var(--color-os-ok) 8%, transparent)" },
  crit: { line: "var(--color-os-crit)", fill: "color-mix(in oklab, var(--color-os-crit) 22%, transparent)", soft: "color-mix(in oklab, var(--color-os-crit) 8%, transparent)" },
  warn: { line: "var(--color-os-warn)", fill: "color-mix(in oklab, var(--color-os-warn) 22%, transparent)", soft: "color-mix(in oklab, var(--color-os-warn) 8%, transparent)" },
  info: { line: "var(--color-os-info)", fill: "color-mix(in oklab, var(--color-os-info) 20%, transparent)", soft: "color-mix(in oklab, var(--color-os-info) 7%, transparent)" },
};

/** Catmull-Rom → cubic Bézier: a curve that reads as a hand, not a formula. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1.2 ? 1.2 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/* ── Area chart with crosshair, tooltip, keyboard cursor ─────────────────── */

export function AreaChart({
  points, tone = "gold", height = 260, format, compare, compareLabel,
  onPointClick, ariaLabel, showAxis = true, highlight, drill,
}: {
  points: Point[];
  tone?: keyof typeof TONES;
  height?: number;
  format?: FormatSpec;
  compare?: number[];
  compareLabel?: string;
  onPointClick?: (index: number) => void;
  ariaLabel?: string;
  showAxis?: boolean;
  highlight?: number | null;
  /** `{at}` is replaced with the bucket's ISO date — keeps the drill serializable. */
  drill?: { href: string };
}) {
  const reduce = useReducedMotion();
  const fmt = useMemo(() => makeFormat(format), [format]);
  const uid = useId().replace(/[:]/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [keyCursor, setKeyCursor] = useState<number | null>(null);
  const cursor = hover ?? keyCursor ?? highlight ?? null;
  const W = 1000;
  const H = height;
  const padL = 12;
  const padR = 12;
  const padT = compare ? 18 : 10;
  const padB = showAxis ? 22 : 8;

  const max = useMemo(() => niceMax(Math.max(...points.map((p) => p.value), ...(compare ?? [0]))), [points, compare]);
  const step = points.length > 1 ? (W - padL - padR) / (points.length - 1) : 0;
  const x = useCallback((i: number) => padL + i * step, [step]);
  const y = useCallback((v: number) => H - padB - (v / max) * (H - padT - padB), [max, H, padB, padT]);
  const pts = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${H - padB} L ${pts[0].x} ${H - padB} Z` : "";
  const compareLine = compare && compare.length ? smoothPath(compare.map((v, i) => ({ x: padL + (i * (W - padL - padR)) / Math.max(1, compare.length - 1), y: y(v) }))) : null;
  const theme = TONES[tone] ?? TONES.gold;
  const active = cursor != null && cursor >= 0 && cursor < points.length ? points[cursor] : null;
  const dataKey = `${points.length}-${Math.round(points.reduce((a, p) => a + p.value, 0))}-${tone}`;

  const go = (index: number) => {
    if (onPointClick) return onPointClick(index);
    if (!drill) return;
    const point = points[index];
    const at = (point?.at ?? "").slice(0, 10) || point?.label || "";
    window.location.href = drill.href.replace("{at}", at).replace("{label}", encodeURIComponent(point?.label ?? ""));
  };

  const onMove = (e: React.PointerEvent) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect || !points.length) return;
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(points.length - 1, Math.round((rel - padL) / Math.max(1, step))));
    setHover(i);
  };

  return (
    <div className="relative w-full select-none" ref={wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height, outlineOffset: 4, cursor: drill || onPointClick ? "pointer" : "crosshair" }}
        role="img"
        aria-label={ariaLabel ?? "Série temporelle"}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setKeyCursor(points.length - 1)}
        onBlur={() => setKeyCursor(null)}
        onClick={() => cursor != null && (drill || onPointClick) && go(cursor)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); setKeyCursor((c) => Math.min(points.length - 1, (c ?? -1) + 1)); }
          if (e.key === "ArrowLeft") { e.preventDefault(); setKeyCursor((c) => Math.max(0, (c ?? points.length) - 1)); }
          if (e.key === "Enter" && keyCursor != null && (drill || onPointClick)) go(keyCursor);
        }}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <motion.rect
              key={dataKey}
              x={0} y={0} height={H}
              initial={reduce ? { width: W } : { width: 0 }}
              animate={{ width: W }}
              transition={{ duration: reduce ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={W - padR} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-os-line)" strokeWidth={0.6} strokeDasharray={f === 1 ? undefined : "3 5"} opacity={f === 1 ? 0.9 : 0.55} />
        ))}

        {compareLine && <path d={compareLine} fill="none" stroke="var(--color-os-onink-faint)" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.75} />}

        <g clipPath={`url(#clip-${uid})`}>
          {area && <path d={area} fill={theme.fill} />}
          <motion.path
            d={line} fill="none" stroke={theme.line} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 1.05, ease: [0.16, 1, 0.3, 1] }}
          />
        </g>

        {active && cursor != null && (
          <g>
            <line x1={x(cursor)} x2={x(cursor)} y1={padT} y2={H - padB} stroke={theme.line} strokeWidth={1} strokeDasharray="2 3" />
            <circle cx={x(cursor)} cy={y(active.value)} r={4.5} fill="var(--color-os-surface)" stroke={theme.line} strokeWidth={2} />
          </g>
        )}
        {showAxis && points.length > 1 && (
          <g>
            {points.map((p, i) =>
              i % Math.ceil(points.length / 7) === 0 || i === points.length - 1 ? (
                <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize={11} fill="var(--color-os-faint)">
                  {p.label}
                </text>
              ) : null,
            )}
          </g>
        )}
      </svg>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={osMicro}
            className="pointer-events-none absolute top-0 z-10 border border-os-line-strong bg-os-ink px-3 py-2 text-os-onink shadow-os-lift"
            style={{ left: `${((cursor! + 0.5) / points.length) * 100}%`, transform: `translateX(${cursor! > points.length / 2 ? "-105%" : "5%"})` }}
          >
            <p className="os-label text-os-onink-faint">{active.label}</p>
            <p className="os-num mt-0.5 text-[15px]">{fmt(active.value)}</p>
            {compare && compare[cursor!] != null && (
              <p className="os-num mt-0.5 text-[11px] text-os-onink-muted">
                {compareLabel ?? "période préc."} · {fmt(compare[cursor!])}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sparkline ───────────────────────────────────────────────────────────── */

export function Sparkline({ values, tone = "gold", height = 34, className, width = 120, label }: { values: number[]; tone?: keyof typeof TONES; height?: number; className?: string; width?: number; label?: string }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const y = (v: number) => height - 3 - ((v - min) / Math.max(1, max - min)) * (height - 6);
  const d = smoothPath(values.map((v, i) => ({ x: i * step, y: y(v) })));
  const theme = TONES[tone] ?? TONES.gold;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={cn("overflow-visible", className)} role={label ? "img" : "presentation"} aria-label={label}>
      {values.length > 1 && <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={theme.soft} />}
      <path d={d} fill="none" stroke={theme.line} strokeWidth={1.5} strokeLinecap="round" />
      {values.length > 0 && <circle cx={(values.length - 1) * step} cy={y(values[values.length - 1])} r={2.4} fill={theme.line} />}
    </svg>
  );
}

/* ── Bars ────────────────────────────────────────────────────────────────── */

export function BarChart({
  points, tone = "gold", height = 200, format, highlight, onPointClick, ariaLabel,
}: { points: Point[]; tone?: keyof typeof TONES; height?: number; format?: FormatSpec; highlight?: number | null; onPointClick?: (i: number) => void; ariaLabel?: string }) {
  const reduce = useReducedMotion();
  const fmt = useMemo(() => makeFormat(format), [format]);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const theme = TONES[tone] ?? TONES.gold;
  const active = hover ?? highlight ?? null;
  return (
    <div className="w-full">
      <div className="flex items-end gap-[3px]" style={{ height }} role="img" aria-label={ariaLabel ?? "Histogramme"}>
        {points.map((p, i) => {
          const h = max > 0 ? Math.max(1.5, (p.value / max) * (height - 18)) : 1.5;
          return (
            <button
              key={`${p.label}-${i}`}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onPointClick?.(i)}
              className="group relative flex flex-1 flex-col justify-end focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-os-gold"
              title={`${p.label} · ${fmt(p.value)}`}
            >
              <motion.span
                className="block w-full origin-bottom"
                style={{ background: active === i ? theme.line : theme.fill }}
                initial={reduce ? { height: h } : { height: 0 }}
                animate={{ height: h }}
                transition={{ ...osStandard, delay: reduce ? 0 : Math.min(0.3, i * 0.012) }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-os-faint">
        {points.length > 0 && <span>{points[0].label}</span>}
        {active != null && <span className="os-num text-os-text">{points[active].label} · {fmt(points[active].value)}</span>}
        {points.length > 1 && <span>{points[points.length - 1].label}</span>}
      </div>
    </div>
  );
}

/* ── Donut ───────────────────────────────────────────────────────────────── */

export function Donut({
  segments, size = 200, thickness = 30, center, centerLabel, format,
}: { segments: { label: string; value: number; tone?: keyof typeof TONES }[]; size?: number; thickness?: number; center?: string; centerLabel?: string; format?: FormatSpec }) {
  const reduce = useReducedMotion();
  const fmt = useMemo(() => makeFormat(format), [format]);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const fracs = segments.map((s) => (total > 0 ? s.value / total : 0));
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((a, f) => a + f, 0));
  const [hover, setHover] = useState<string | null>(null);
  const active = segments.find((s) => s.label === hover);
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s, i) => {
            const frac = fracs[i];
            const theme = TONES[s.tone ?? "gold"] ?? TONES.gold;
            const el = (
              <motion.circle
                key={s.label}
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={theme.line} strokeWidth={hover === s.label ? thickness + 4 : thickness}
                strokeDasharray={`${frac * c} ${c}`}
                strokeDashoffset={-starts[i] * c}
                initial={reduce ? undefined : { opacity: 0 }}
                animate={reduce ? undefined : { opacity: 1 }}
                transition={{ ...osMicro, delay: reduce ? 0 : 0.05 }}
                onMouseEnter={() => setHover(s.label)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: "stroke-width 160ms" }}
              />
            );
            return el;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="os-num" fontSize={size * 0.11} fill="var(--color-os-text)" fontFamily="var(--font-sans)">
          {active ? fmt(active.value) : center ?? fmt(total)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize={11} fill="var(--color-os-faint)" letterSpacing="0.12em">
          {(active?.label ?? centerLabel ?? "").toUpperCase()}
        </text>
      </svg>
      <ul className="min-w-[9rem] flex-1 space-y-1.5">
        {segments.map((s) => {
          const theme = TONES[s.tone ?? "gold"] ?? TONES.gold;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-1 text-[12px] last:border-0" onMouseEnter={() => setHover(s.label)} onMouseLeave={() => setHover(null)}>
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0" style={{ background: theme.line }} aria-hidden />
                <span className="truncate text-os-text">{s.label}</span>
              </span>
              <span className="os-num shrink-0 text-os-muted">{fmt(s.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Funnel ──────────────────────────────────────────────────────────────── */

export function Funnel({
  stages, format,
}: { stages: { label: string; count: number; href?: string; note?: string; value?: number }[]; format?: FormatSpec }) {
  const reduce = useReducedMotion();
  const fmt = useMemo(() => makeFormat(format), [format]);
  const max = Math.max(...stages.map((s) => s.count), 1);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <ol className="space-y-1.5">
      {stages.map((s, i) => {
        const pct = (s.count / max) * 100;
        const prev = i > 0 ? stages[i - 1].count : null;
        const drop = prev && prev > 0 ? ((prev - s.count) / prev) * 100 : null;
        const body = (
          <div
            className={cn("group relative flex items-center gap-3 px-1 py-1.5 transition-colors", s.href && "hover:bg-os-surface-2/70")}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="os-num w-6 shrink-0 text-[10px] text-os-faint">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] text-os-text">{s.label}</span>
                <span className="os-num shrink-0 text-[13px] text-os-text">{fmt(s.count)}</span>
              </div>
              <div className="mt-1.5 h-[6px] w-full bg-os-surface-3">
                <motion.div
                  className="h-full"
                  style={{ background: hover === i ? "var(--color-os-ink)" : "var(--color-os-gold)" }}
                  initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ...osStandard, delay: reduce ? 0 : i * 0.05 }}
                />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 text-[11px]">
                <span className="truncate text-os-muted">{s.note ?? ""}</span>
                {drop != null && drop > 0 && <span className="os-num text-os-crit">−{drop.toFixed(0)} %</span>}
                {drop != null && drop <= 0 && <span className="os-num text-os-ok">+{Math.abs(drop).toFixed(0)} %</span>}
              </div>
            </div>
          </div>
        );
        return (
          <li key={s.label}>
            {s.href ? <Link href={s.href} className="block">{body}</Link> : body}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Heatmap (hour × weekday) ────────────────────────────────────────────── */

export function Heatmap({
  matrix, rowLabels, colLabels, format, tone = "gold",
}: { matrix: number[][]; rowLabels: string[]; colLabels: string[]; format?: FormatSpec; tone?: keyof typeof TONES }) {
  const reduce = useReducedMotion();
  const fmt = useMemo(() => makeFormat(format), [format]);
  const max = Math.max(1, ...matrix.flat());
  const theme = TONES[tone] ?? TONES.gold;
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  return (
    <div className="min-w-0">
      <div className="os-num flex gap-[3px] overflow-x-auto pb-1">
        <span className="w-8 shrink-0" />
        {colLabels.map((c) => (
          <span key={c} className="w-[26px] shrink-0 text-center text-[9px] uppercase tracking-[0.08em] text-os-faint">{c}</span>
        ))}
      </div>
      <div className="space-y-[3px]">
        {matrix.map((row, r) => (
          <div key={rowLabels[r]} className="flex items-center gap-[3px]">
            <span className="w-8 shrink-0 text-[10px] uppercase tracking-[0.08em] text-os-faint">{rowLabels[r]}</span>
            {row.map((v, c) => (
              <motion.span
                key={c}
                className="h-[22px] w-[26px] shrink-0"
                style={{ background: v === 0 ? "var(--color-os-surface-2)" : theme.line, opacity: v === 0 ? 1 : 0.22 + 0.78 * (v / max) }}
                initial={reduce ? undefined : { opacity: 0 }}
                animate={reduce ? undefined : { opacity: v === 0 ? 1 : 0.22 + 0.78 * (v / max) }}
                transition={{ ...osMicro, delay: reduce ? 0 : (r * colLabels.length + c) * 0.004 }}
                onMouseEnter={() => setHover({ r, c })}
                onMouseLeave={() => setHover(null)}
                title={`${rowLabels[r]} ${colLabels[c]} — ${fmt(v)}`}
              />
            ))}
            {hover?.r === r && <span className="os-num ml-2 text-[11px] text-os-text">{rowLabels[r]} {colLabels[hover.c]} · {fmt(row[hover.c])}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal comparison bars (categories, brands, products) ──────────── */

export function BarList({
  rows, format, tone = "gold",
}: { rows: { label: string; value: number; sub?: string; href?: string; image?: string | null }[]; format?: FormatSpec; tone?: keyof typeof TONES }) {
  const fmt = useMemo(() => makeFormat(format), [format]);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const theme = TONES[tone] ?? TONES.gold;
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const body = (
          <div className="group">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                {r.image && <img src={r.image} alt="" className="h-6 w-6 shrink-0 object-cover" loading="lazy" />}
                <span className="truncate text-[13px] text-os-text">{r.label}</span>
              </span>
              <span className="os-num shrink-0 text-[13px] text-os-text">{fmt(r.value)}</span>
            </div>
            <div className="mt-1 h-[3px] w-full bg-os-surface-3">
              <motion.div className="h-full" style={{ background: theme.line }} initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={osStandard} />
            </div>
            {r.sub && <p className="mt-1 truncate text-[11px] text-os-muted">{r.sub}</p>}
          </div>
        );
        return <li key={r.label}>{r.href ? <Link href={r.href} className="block transition-opacity hover:opacity-80">{body}</Link> : body}</li>;
      })}
    </ul>
  );
}
