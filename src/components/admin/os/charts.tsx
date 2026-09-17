"use client";
import Link from "next/link";
import type { FormatSpec } from "./format";
import { makeFormat } from "./format";

export type Point = { label: string; value: number; at?: string };
export type { FormatSpec };

function fmt(v: number, f?: FormatSpec) {
  const fn = makeFormat(f ?? { kind: "count" });
  return fn(v);
}

export function AreaChart({ points, height = 200, format, ...rest }: { points: Point[]; height?: number; tone?: string; format?: FormatSpec; ariaLabel?: string; drill?: any; showAxis?: boolean; compare?: any; compareLabel?: string; onPointClick?: any; highlight?: any; [key: string]: any }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="border border-line bg-bg p-4">
      <div className="flex items-end gap-px" style={{ height }}>
        {points.map((p, i) => (
          <div key={i} className="flex-1 bg-ink" style={{ height: `${(p.value / max) * 100}%` }} title={`${p.label}: ${fmt(p.value, format)}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function BarList({ rows, format, ...rest }: { rows: { label: string; value: number; sub?: string; href?: string; image?: string | null; note?: string }[]; format?: FormatSpec; [key: string]: any }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const content = (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-text-muted w-6">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate font-sans text-[13px]">{r.label}</p>
              {r.sub && <p className="truncate font-mono text-[11px] text-text-muted">{r.sub}</p>}
              <div className="mt-1 h-[2px] w-full bg-line"><div className="h-full bg-ink" style={{ width: `${(r.value / max) * 100}%` }} /></div>
            </div>
            <span className="font-mono text-[12px]">{fmt(r.value, format)}</span>
          </div>
        );
        return r.href ? <Link key={i} href={r.href} className="block border-b border-line py-2 last:border-0 hover:bg-bg-2">{content}</Link> : <div key={i} className="border-b border-line py-2 last:border-0">{content}</div>;
      })}
    </div>
  );
}

export function BarChart({ points, height = 120, format, ...rest }: { points: Point[]; height?: number; tone?: string; format?: FormatSpec; [key: string]: any }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="border border-line bg-bg p-3">
      <div className="flex items-end gap-1" style={{ height }}>
        {points.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-ink" style={{ height: `${(p.value / max) * 100}%` }} title={`${p.label}: ${fmt(p.value, format)}`} />
            <span className="font-mono text-[9px] text-text-muted truncate w-full text-center">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({ segments, centerLabel, center, format, ...rest }: { segments: { label: string; value: number; tone?: string }[]; centerLabel?: string; center?: string | number; format?: any; [key: string]: any }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div className="border border-line bg-bg p-4">
      <div className="flex items-center justify-center h-32 border border-dashed border-line">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{centerLabel}</p>
          <p className="font-sans text-[20px] font-semibold">{center}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex justify-between font-mono text-[11px]">
            <span>{s.label}</span>
            <span>{((s.value / total) * 100).toFixed(0)}% — {s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Funnel({ stages, ...rest }: { stages: { label: string; count: number; note?: string; href?: string }[]; [key: string]: any }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const inner = (
          <div className="border border-line p-3">
            <div className="flex justify-between font-mono text-[11px]"><span>{s.label}</span><span>{s.count}</span></div>
            <div className="mt-2 h-[2px] w-full bg-line"><div className="h-full bg-ink" style={{ width: `${(s.count / max) * 100}%` }} /></div>
            {s.note && <p className="mt-1 font-mono text-[10px] text-text-muted">{s.note}</p>}
          </div>
        );
        return (s as any).href ? <Link key={i} href={(s as any).href} className="block hover:bg-bg-2">{inner}</Link> : <div key={i}>{inner}</div>;
      })}
    </div>
  );
}

export function Heatmap({ matrix, rowLabels, colLabels, ...rest }: { matrix: number[][]; rowLabels: string[]; colLabels: string[]; format?: FormatSpec; tone?: string; [key: string]: any }) {
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 font-mono text-[10px] text-text-muted"></th>
            {colLabels.map((c, i) => <th key={i} className="p-2 font-mono text-[9px] text-text-muted">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              <td className="p-2 font-mono text-[10px] text-text-muted border-r border-line">{rowLabels[ri]}</td>
              {row.map((v, ci) => (
                <td key={ci} className="p-1"><div className="h-6 w-full" style={{ background: `rgba(0,0,0,${(v / max) * 0.8})` }} title={`${v}`} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sparkline({ values, width = 100, height = 30, tone = "gold", label }: { values: number[]; width?: number; height?: number; tone?: string; label?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-px" style={{ width, height }}>
      {values.map((v, i) => <div key={i} className="flex-1 bg-ink" style={{ height: `${(v / max) * 100}%` }} />)}
    </div>
  );
}
