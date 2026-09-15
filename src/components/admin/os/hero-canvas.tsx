"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { osStandard } from "@/lib/admin/motion";
import { AnimatedNumber } from "./motion";
import { AreaChart, Sparkline, type Point } from "./charts";
import { CompareToggle, MetricSwitch, PeriodSwitch } from "./controls";
import { DeltaIcon, ExternalIcon } from "./icons";

/* ══════════════════════════════════════════════════════════════════════════
   TOILE DE COMMANDE — le chiffre d'affaires, grandeur nature
   ──────────────────────────────────────────────────────────────────────────
   The opening move of the instrument: one business figure drawn at scale, its
   own history behind it, the previous window ghosted on top, and a cursor that
   turns any point into a question ("what happened on the 14th?") which the
   operator answers by walking into the day itself.
   ══════════════════════════════════════════════════════════════════════════ */

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
  /** every metric that shares this canvas, already keyed for the URL */
  available: { key: string; label: string }[];
};

const dt = (millimes: number) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(millimes / 1000);

export function HeroCanvas({
  hero, basePath = "/admin", period, from, to, compareOn, secondary,
}: {
  hero: HeroMetric;
  basePath?: string;
  period: string;
  from?: string;
  to?: string;
  compareOn: boolean;
  secondary: { label: string; value: number; unit: "millimes" | "count"; deltaPct: number | null; dir: "up" | "down" | "flat"; spark: number[]; href?: string }[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [focusPoint, setFocusPoint] = useState<number | null>(null);

  const fmt = useMemo(() => {
    if (hero.unit === "millimes") return (v: number) => `${dt(v)} DT`;
    if (hero.unit === "decimal") return (v: number) => new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 2 }).format(v);
    return (v: number) => new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);
  }, [hero.unit]);

  const big = hero.unit === "millimes" ? dt(hero.value) : fmt(hero.value);
  const suffix = hero.unit === "millimes" ? "DT" : hero.unit === "count" ? "" : "";
  const compared = compareOn && hero.previous !== 0 ? hero.previous : hero.year ?? 0;

  const drill = (index: number) => {
    const point = hero.series[index];
    if (!point) return;
    const day = (point.at ?? new Date().toISOString()).slice(0, 10);
    router.push(`/admin/analytique?p=custom&from=${day}&to=${day}`);
  };

  return (
    <section className="relative overflow-hidden border border-os-line bg-os-surface">
      {/* Header instruments */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-os-line px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <MetricSwitch basePath={basePath} current={hero.key} metrics={hero.available} />
          <PeriodSwitch basePath={basePath} current={period} from={from} to={to} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompareToggle basePath={basePath} on={compareOn} label={hero.year != null ? "Période précédente + année" : "Période précédente"} />
          <Link href={`/admin/analytique?p=${period}`} className="flex items-center gap-1.5 border border-os-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-muted transition-colors hover:text-os-text">
            Explorer <ExternalIcon size={12} />
          </Link>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* The canvas */}
        <div className="min-w-0 border-b border-os-line px-3 pb-2 pt-4 sm:px-4 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="os-label text-os-muted">{hero.label}</p>
              <p className="mt-1 flex items-baseline gap-2 font-display leading-none">
                <motion.span
                  key={hero.key + String(hero.value)}
                  initial={reduce ? undefined : { opacity: 0.35, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={osStandard}
                  className="os-num text-[clamp(2.4rem,6vw,4.1rem)] tracking-tight text-os-text"
                >
                  {hero.unit === "millimes" ? <AnimatedNumber value={hero.value} format={dt} /> : <AnimatedNumber value={hero.value} format={fmt} />}
                </motion.span>
                <span className="text-[0.9rem] font-normal text-os-faint">{suffix}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                <span className={cn("os-num flex items-center gap-1.5", hero.dir === "up" ? "text-os-ok" : hero.dir === "down" ? "text-os-crit" : "text-os-muted")}>
                  <DeltaIcon size={12} className={hero.dir === "down" ? "rotate-180" : undefined} />
                  {hero.pct == null ? "— " : `${hero.pct >= 0 ? "+" : ""}${hero.pct.toFixed(1)} %`}
                  <span className="text-os-faint">vs période précédente ({fmt(hero.previous)})</span>
                </span>
                {hero.year != null && (
                  <span className="os-num text-os-muted">
                    <span className="os-label text-os-faint">an dernier</span> {hero.year > 0 ? fmt(hero.year) : "hors historique"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-end gap-6">
              <div className="hidden text-right sm:block">
                <p className="os-label text-os-faint">Tendance</p>
                <Sparkline values={hero.spark} width={132} height={40} tone="gold" label="Tendance de la mesure" />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <AreaChart
              points={hero.series}
              compare={compareOn ? hero.compare : undefined}
              compareLabel="période préc."
              format={{ kind: hero.unit === "millimes" ? "dt" : hero.unit === "decimal" ? "decimal" : "count" }}
              height={268}
              tone="gold"
              ariaLabel={`${hero.label} sur la période`}
              onPointClick={drill}
              highlight={focusPoint}
            />
          </div>
          <p className="pb-2 text-[11px] text-os-faint">
            {compareOn ? "Trait plein : période en cours · pointillé : période de comparaison. " : ""}
            Cliquez un point pour ouvrir la journée correspondante ; ← → pour lire au clavier.
          </p>
        </div>

        {/* Secondary rhythm — dense column beside the canvas */}
        <div className="divide-y divide-os-line">
          {secondary.map((s) => (
            <Link
              key={s.label}
              href={s.href ?? "#"}
              onMouseEnter={() => setFocusPoint(null)}
              className={cn("block px-3 py-3 transition-colors sm:px-4", s.href ? "hover:bg-os-surface-2/70" : "cursor-default")}
            >
              <p className="os-label text-os-muted">{s.label}</p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="os-num text-[1.35rem] font-display leading-none text-os-text">
                  <AnimatedNumber value={s.value} format={s.unit === "millimes" ? dt : (v) => new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v)} />
                  {s.unit === "millimes" && <span className="ml-1 text-[0.65em] font-normal text-os-faint">DT</span>}
                </span>
                <span className={cn("os-num text-[11px]", s.dir === "up" ? "text-os-ok" : s.dir === "down" ? "text-os-crit" : "text-os-muted")}>
                  {s.deltaPct == null ? "—" : `${s.deltaPct >= 0 ? "+" : ""}${s.deltaPct.toFixed(1)} %`}
                </span>
              </div>
              <div className="mt-1.5">
                <Sparkline values={s.spark} width={220} height={26} tone={s.dir === "down" ? "crit" : "ok"} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
