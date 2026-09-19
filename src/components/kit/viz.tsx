import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LES FIGURES — the house's charts.

   A parapharmacie does not need a dashboard; it needs to be believed. Every
   figure here is drawn from a real count in the database, in the house's own
   materials: hairline rules, ink, one signal colour, tabular numerals. No
   gradients, no shadows, no third-party chart library, no client JavaScript —
   these render on the server and paint with the page.

   The rule that keeps them honest: a figure never shows a number the
   shopkeeper could not recompute by counting the shelf.
   ══════════════════════════════════════════════════════════════════════════ */

export type VizPoint = { key: string; label: string; value: number; href?: string };

/** The frame every figure sits in: a kicker, the drawing, and a way to read it. */
export function VizFrame({
  kicker,
  title,
  note,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("border border-line bg-porcelain", className)}>
      <div className="border-b border-line px-5 py-4">
        {kicker ? <p className="kicker-xs text-faint">{kicker}</p> : null}
        <h3 className="mt-1.5 font-display text-[1.35rem] leading-tight text-carbon">{title}</h3>
        {note ? <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-muted">{note}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </figure>
  );
}

/**
 * BARRES — a distribution. The bars are the control: each one is a link, so
 * reading the catalogue and filtering it are the same gesture (item 5, item
 * 32, item 33).
 */
export function Bars({
  points,
  unit,
  activeKey,
  className,
}: {
  points: VizPoint[];
  unit?: string;
  activeKey?: string;
  className?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className={cn("flex items-end gap-1.5", className)}>
      {points.map((p) => {
        const h = Math.max(2, Math.round((p.value / max) * 100));
        const active = activeKey === p.key;
        const body = (
          <>
            <span
              aria-hidden
              className={cn(
                "block w-full border-t transition-[height] duration-500",
                active ? "border-iodine bg-iodine/20" : "border-carbon bg-carbon/10",
              )}
              style={{ height: `${h}%` }}
            />
            <span className="mt-1.5 block truncate text-center text-[10px] tabular-nums text-faint">{p.label}</span>
          </>
        );
        return p.href ? (
          <a
            key={p.key}
            href={p.href}
            className="group flex h-28 flex-1 flex-col justify-end"
            title={`${p.label} — ${p.value}${unit ? ` ${unit}` : ""}`}
          >
            {body}
          </a>
        ) : (
          <div key={p.key} className="flex h-28 flex-1 flex-col justify-end" title={`${p.label} — ${p.value}`}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/**
 * L'ÉCHELLE — a horizontal reading of the same thing, for narrow columns and
 * for "your rayon vs the rest" comparisons (item 33).
 */
export function Scale({
  points,
  unit = "",
  className,
}: {
  points: (VizPoint & { tone?: "ink" | "iodine" })[];
  unit?: string;
  className?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <dl className={cn("space-y-2.5", className)}>
      {points.map((p) => (
        <div key={p.key} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
          <dt className="truncate text-[12.5px] text-muted">{p.label}</dt>
          <dd className="h-2 bg-canvas-2">
            <div
              className={cn("h-full", p.tone === "iodine" ? "bg-iodine" : "bg-carbon/70")}
              style={{ width: `${Math.max(2, (p.value / max) * 100)}%` }}
            />
          </dd>
          <dd className="text-[12.5px] tabular-nums text-carbon">
            {p.value}
            {unit}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * LE CADRAN — a radial reading of the catalogue (item 3). Each arc is sized
 * by its real count; the ring reads clockwise from twelve o'clock, like a
 * clock face, because that is what a cadran is.
 */
export function Cadran({
  points,
  size = 260,
  className,
}: {
  points: VizPoint[];
  size?: number;
  className?: string;
}) {
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  const r = size / 2 - 26;
  const gap = 2.5;
  // A fold, not an accumulator mutated in place: the ring is derived, so a
  // re-render can never walk it twice from a different starting angle.
  const arcs = points.reduce<{ list: (VizPoint & { start: number; end: number })[]; angle: number }>(
    (acc, p) => {
      const sweep = (p.value / total) * 360;
      const start = acc.angle + gap / 2;
      const end = acc.angle + sweep - gap / 2;
      return {
        list: [...acc.list, { ...p, start, end: Math.max(start + 0.6, end) }],
        angle: acc.angle + sweep,
      };
    },
    { list: [], angle: -90 },
  ).list;

  const polar = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [size / 2 + radius * Math.cos(rad), size / 2 + radius * Math.sin(rad)];
  };
  const arcPath = (a0: number, a1: number, radius: number) => {
    const [x0, y0] = polar(a0, radius);
    const [x1, y1] = polar(a1, radius);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };

  return (
    <div className={cn("grid items-center gap-8 sm:grid-cols-[auto_1fr]", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition du catalogue par besoin">
        <circle cx={size / 2} cy={size / 2} r={r + 14} fill="none" stroke="var(--color-line-soft)" strokeWidth="1" />
        {arcs.map((a) => {
          const [lx, ly] = polar((a.start + a.end) / 2, r + 14);
          return a.href ? (
            <a key={a.key} href={a.href} aria-label={`${a.label} — ${a.value} références`}>
              <path
                d={arcPath(a.start, a.end, r)}
                fill="none"
                stroke="var(--color-carbon)"
                strokeWidth="16"
                opacity={0.82}
                className="transition-opacity hover:opacity-100"
              />
              <path d={arcPath(a.start, a.end, r + 8)} fill="none" stroke="var(--color-iodine)" strokeWidth="2" opacity="0.5" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--color-faint)] text-[9px]">
                {a.value}
              </text>
            </a>
          ) : (
            <path key={a.key} d={arcPath(a.start, a.end, r)} fill="none" stroke="var(--color-carbon)" strokeWidth="16" opacity={0.82} />
          );
        })}
      </svg>

      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p.key}>
            <a
              href={p.href ?? "#"}
              className="group flex items-baseline justify-between gap-3 border-b border-line-soft py-1.5 text-[13px] transition-colors hover:border-iodine"
            >
              <span className="truncate text-muted group-hover:text-carbon">{p.label}</span>
              <span className="shrink-0 tabular-nums text-carbon">{p.value}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** L'ÉTINCELLE — a series at a glance: sales, reviews, stock movements. */
export function Sparkline({
  values,
  width = 120,
  height = 28,
  tone = "ink",
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: "ink" | "iodine" | "sea";
  className?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const stroke = tone === "iodine" ? "var(--color-iodine)" : tone === "sea" ? "var(--color-sea)" : "var(--color-carbon)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className={className}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * LA CARTE DE CHALEUR — hour × day, for the back office (item 79). Drawn as
 * a grid of hairline cells: the darker the cell, the busier that slot. It is
 * how a pharmacist decides who stands at the counter on Saturday morning.
 */
export function Heat({
  rows,
  columns,
  values,
  className,
}: {
  rows: string[];
  columns: string[];
  /** values[rowIndex][columnIndex] */
  values: number[][];
  className?: string;
}) {
  const max = Math.max(1, ...values.flat());
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {columns.map((c) => (
              <th key={c} className="px-1 pb-1.5 text-center text-[10px] font-normal uppercase tracking-[0.12em] text-faint">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row}>
              <td className="pr-2 text-right text-[11px] tabular-nums text-faint">{row}</td>
              {columns.map((_, c) => {
                const v = values[r]?.[c] ?? 0;
                const t = v / max;
                return (
                  <td key={c} className="p-px">
                    <div
                      title={`${row} · ${columns[c]} — ${v}`}
                      className="mx-auto h-7 w-full"
                      style={{ background: v === 0 ? "var(--color-canvas-2)" : `color-mix(in oklab, var(--color-carbon) ${8 + t * 82}%, var(--color-canvas-2))` }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
