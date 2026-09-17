"use client";
import Link from "next/link";
import { AreaChart, type Point } from "./charts";

export type HeroMetric = {
  key: string;
  label: string;
  short: string;
  hint: string;
  unit: "millimes" | "count" | "decimal";
  value: number;
  previous: number;
  year: number | null;
  pct: number | null;
  dir: "up" | "down" | "flat";
  series: Point[];
  compare: number[];
  spark: number[];
  available: { key: string; label: string }[];
};

export function HeroCanvas({ hero, period, compareOn, secondary }: { hero: HeroMetric; basePath?: string; period: string; from?: string; to?: string; compareOn: boolean; secondary: any[] }) {
  const fmt = (v: number) => new Intl.NumberFormat("fr-TN").format(v);
  return (
    <section className="border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{hero.label} — {period}</p>
        <Link href="/admin/analytique" className="font-mono text-[11px] uppercase tracking-[0.12em] underline">Explorer →</Link>
      </div>
      <div className="grid lg:grid-cols-[1fr_280px] gap-px bg-line">
        <div className="bg-bg p-6">
          <p className="font-sans text-[40px] font-bold tracking-[-0.02em] leading-none">{hero.unit === "millimes" ? `${(hero.value / 1000).toFixed(0)} DT` : fmt(hero.value)}</p>
          <p className="mt-2 font-mono text-[11px] text-text-muted">{hero.pct != null ? `${hero.pct >= 0 ? "+" : ""}${hero.pct.toFixed(1)}% vs précédente` : ""}</p>
          <div className="mt-6">
            <AreaChart points={hero.series} height={240} />
          </div>
        </div>
        <div className="bg-bg divide-y divide-line">
          {secondary.map((s, i) => (
            <Link key={i} href={s.href ?? "#"} className="block p-4 hover:bg-bg-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{s.label}</p>
              <p className="mt-2 font-sans text-[18px] font-semibold">{s.unit === "millimes" ? `${(s.value / 1000).toFixed(0)} DT` : fmt(s.value)}</p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">{s.deltaPct != null ? `${s.deltaPct >= 0 ? "+" : ""}${s.deltaPct.toFixed(1)}%` : ""}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
