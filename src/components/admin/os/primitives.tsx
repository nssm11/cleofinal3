import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

/* ══════════════════════════════════════════════════════════════════════════
   L'INSTRUMENT — surfaces, figures, tags, states
   ──────────────────────────────────────────────────────────────────────────
   Three materials only:
     · Sheet        a piece of paper laid on the desk — the work surface
     · Instrument   a dark panel — measurement, never decoration
     · Rule         a hairline — the only separation the instrument trusts
   Everything else is a figure, a label or a state. Read-only: no hooks, so
   these render on the server and cost nothing on the client.
   ══════════════════════════════════════════════════════════════════════════ */

export function Sheet({ children, className, padded = true, as: As = "section" }: { children: ReactNode; className?: string; padded?: boolean; as?: "section" | "div" | "article" }) {
  return <As className={cn("border border-os-line bg-os-surface shadow-os-sheet", padded && "p-4 sm:p-5", className)}>{children}</As>;
}

export function Instrument({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("os-instrument relative overflow-hidden text-os-onink", padded && "p-4 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function Rule({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div aria-hidden className={cn(vertical ? "w-px self-stretch" : "h-px w-full", "bg-os-line", className)} />;
}

export function SectionHead({ eyebrow, title, action, sub, className }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="os-label mb-1.5 text-os-gold">{eyebrow}</p>}
        <h2 className="font-sans text-[1.35rem] leading-tight tracking-tight text-os-text sm:text-[1.6rem]">{title}</h2>
        {sub && <div className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-os-muted">{sub}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info" | "gold";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-os-muted",
  good: "text-os-ok",
  warn: "text-os-warn",
  bad: "text-os-crit",
  info: "text-os-info",
  gold: "text-os-gold",
};
const TONE_BG: Record<Tone, string> = {
  neutral: "bg-os-surface-3 text-os-muted",
  good: "bg-os-ok-soft text-os-ok",
  warn: "bg-os-warn-soft text-os-warn",
  bad: "bg-os-crit-soft text-os-crit",
  info: "bg-os-info-soft text-os-info",
  gold: "bg-os-gold-soft text-os-gold-2",
};

export function tagTone(kind: "status" | "payment" | "severity" | "signal", value: string): Tone {
  if (kind === "status") {
    switch (value) {
      case "delivered": return "good";
      case "shipped": return "info";
      case "cancelled": case "returned": return "bad";
      case "pending": return "warn";
      default: return "gold";
    }
  }
  if (kind === "payment") {
    switch (value) {
      case "paid": return "good";
      case "failed": return "bad";
      case "refunded": return "warn";
      default: return "neutral";
    }
  }
  if (kind === "severity") return value === "critical" ? "bad" : value === "high" ? "warn" : "neutral";
  return value === "chaud" ? "bad" : value === "tiede" ? "warn" : "neutral";
}

export function Tag({ children, tone = "neutral", className, title }: { children: ReactNode; tone?: Tone; className?: string; title?: string }) {
  return <span title={title} className={cn("inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", TONE_BG[tone], className)}>{children}</span>;
}

export function StatusTag({ status, className }: { status: OrderStatus | string; className?: string }) {
  const label = ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
  return <Tag tone={tagTone("status", status)} className={className}>{label}</Tag>;
}

export function PaymentTag({ status }: { status: string }) {
  const label = status === "paid" ? "Encaissé" : status === "pending" ? "En attente" : status === "refunded" ? "Remboursé" : status === "failed" ? "Refusé" : status;
  return <Tag tone={tagTone("payment", status)}>{label}</Tag>;
}

export function Money({ millimes, className, signed }: { millimes: number; className?: string; signed?: boolean }) {
  const dt = millimes / 1000;
  const formatted = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: dt % 1 === 0 ? 0 : 3, maximumFractionDigits: 3 }).format(Math.abs(dt));
  return (
    <span className={cn("os-num", className)}>
      {signed && millimes > 0 ? "+" : signed && millimes < 0 ? "−" : ""}
      {formatted}
      <span className="ml-1 text-[0.72em] font-normal text-os-faint">DT</span>
    </span>
  );
}

/* ── Metrics ─────────────────────────────────────────────────────────────── */

export function Metric({
  label, value, unit, sub, delta, tone = "neutral", size = "md", className, hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  delta?: { value: number | null; dir: "up" | "down" | "flat"; suffix?: string; invert?: boolean };
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hint?: string;
}) {
  const sizes = {
    sm: "text-[1.1rem]",
    md: "text-[1.6rem]",
    lg: "text-[2.1rem]",
    xl: "text-os-metric",
  } as const;
  const good = delta ? (delta.invert ? delta.dir === "down" : delta.dir === "up") : false;
  const bad = delta ? (delta.invert ? delta.dir === "up" : delta.dir === "down") : false;
  return (
    <div className={cn("min-w-0", className)}>
      <p className="os-label text-os-muted" title={hint}>{label}</p>
      <p className={cn("os-num mt-1.5 font-sans leading-none tracking-tight", sizes[size], TONE_CLASS[tone])}>
        {value}
        {unit && <span className="ml-1 text-[0.6em] font-normal text-os-faint">{unit}</span>}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {delta && delta.value !== null && (
          <Tag tone={good ? "good" : bad ? "bad" : "neutral"} className="os-num">
            {delta.dir === "up" ? "▲" : delta.dir === "down" ? "▼" : "="} {Math.abs(delta.value).toFixed(1)} %{delta.suffix ? ` ${delta.suffix}` : ""}
          </Tag>
        )}
        {sub && <span className="text-[11px] leading-tight text-os-muted">{sub}</span>}
      </div>
    </div>
  );
}

export function KeyValue({ items, className, dense }: { items: { label: string; value: ReactNode; hint?: string }[]; className?: string; dense?: boolean }) {
  return (
    <dl className={cn("grid gap-x-6", dense ? "gap-y-1.5" : "gap-y-2.5", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-os-line-soft pb-1.5 last:border-0">
          <dt className="text-[11px] uppercase tracking-[0.1em] text-os-muted">{it.label}</dt>
          <dd className="os-num text-right text-[13px] text-os-text" title={it.hint}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Controls ────────────────────────────────────────────────────────────── */

const BTN_BASE = "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.13em] transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40";
const BTN_VARIANT = {
  primary: "bg-os-ink px-3.5 text-os-onink hover:bg-os-ink-2",
  gold: "bg-os-gold px-3.5 text-[#fffaf0] hover:bg-os-gold-2",
  ghost: "border border-os-line bg-transparent px-3.5 text-os-text hover:border-os-line-strong hover:bg-os-surface-2",
  quiet: "px-2 text-os-muted hover:bg-os-surface-2 hover:text-os-text",
  danger: "border border-os-crit/40 px-3.5 text-os-crit hover:bg-os-crit-soft",
} as const;
const BTN_SIZE = { sm: "min-h-8", md: "min-h-10", lg: "min-h-12" } as const;

export type ButtonVariant = keyof typeof BTN_VARIANT;

export function OsButton({ children, variant = "ghost", size = "md", className, type = "button", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof BTN_SIZE }) {
  return <button type={type} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...rest}>{children}</button>;
}

export function OsLink({ children, href, variant = "ghost", size = "md", className, prefetch, title, target }: { children: ReactNode; href: string; variant?: ButtonVariant; size?: keyof typeof BTN_SIZE; className?: string; prefetch?: boolean; title?: string; target?: string }) {
  const external = /^https?:/.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  if (external) {
    return <a href={href} target={target ?? "_blank"} rel="noopener noreferrer" title={title} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}>{children}</a>;
  }
  return <Link href={href} prefetch={prefetch} title={title} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}>{children}</Link>;
}

/* ── Meters, gauges, ranks ───────────────────────────────────────────────── */

export function Meter({ value, max = 100, tone = "gold", className, label }: { value: number; max?: number; tone?: Tone; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const bar = tone === "bad" ? "bg-os-crit" : tone === "warn" ? "bg-os-warn" : tone === "good" ? "bg-os-ok" : tone === "info" ? "bg-os-info" : "bg-os-gold";
  return (
    <div className={cn("min-w-0", className)}>
      {label && <div className="mb-1 flex items-baseline justify-between gap-3"><span className="os-label text-os-muted">{label}</span><span className="os-num text-[11px] text-os-muted">{Math.round(pct)} %</span></div>}
      <div className="h-[3px] w-full overflow-hidden bg-os-surface-3" role="presentation">
        <div className={cn("h-full transition-[width] duration-500 ease-out", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RankRow({ position, label, sub, value, max, href, tone = "gold", image }: { position: number; label: string; sub?: ReactNode; value: ReactNode; max: number; href?: string; tone?: Tone; image?: string | null }) {
  const pct = max > 0 ? Math.max(3, (Number(String(value).replace(/[^\d.]/g, "")) / max) * 100) : 0;
  const bar = tone === "bad" ? "bg-os-crit/70" : tone === "warn" ? "bg-os-warn/70" : tone === "info" ? "bg-os-info/60" : "bg-os-gold/70";
  const body = (
    <div className="group grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 py-2">
      <span className="os-num text-[11px] text-os-faint">{String(position).padStart(2, "0")}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {image && <img src={image} alt="" className="h-6 w-6 shrink-0 object-cover" loading="lazy" />}
          <p className="truncate text-[13px] text-os-text">{label}</p>
        </div>
        <div className="mt-1 h-[2px] w-full bg-os-surface-3">
          <div className={cn("h-full", bar)} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        {sub && <p className="mt-1 truncate text-[11px] text-os-muted">{sub}</p>}
      </div>
      <span className="os-num shrink-0 text-[13px] text-os-text">{value}</span>
    </div>
  );
  return href ? <Link href={href} className="block transition-colors hover:bg-os-surface-2/70">{body}</Link> : body;
}

/* ── States ──────────────────────────────────────────────────────────────── */

export function EmptyState({ title, why, action, icon, className }: { title: string; why: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-3 border border-dashed border-os-line-strong/70 bg-os-surface-2/60 p-5", className)}>
      <div className="flex items-center gap-2.5 text-os-gold">{icon}<p className="font-sans text-[1.05rem] tracking-tight text-os-text">{title}</p></div>
      <p className="max-w-[64ch] text-[13px] leading-relaxed text-os-muted">{why}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, detail, action, technical }: { title: string; detail: string; action?: ReactNode; technical?: string }) {
  return (
    <div className="border border-os-crit/30 bg-os-crit-soft/60 p-5">
      <p className="font-sans text-[1.05rem] tracking-tight text-os-crit">{title}</p>
      <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-os-text/80">{detail}</p>
      {technical && <pre className="os-scroll mt-3 max-h-32 overflow-auto border border-os-crit/20 bg-os-surface/70 p-2.5 font-mono text-[11px] text-os-muted">{technical}</pre>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("relative overflow-hidden bg-os-surface-3/80", className)} style={style} aria-hidden><span className="absolute inset-0 os-sweep" /></div>;
}

export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 border border-os-line bg-os-surface p-3">
      <Skeleton className="h-6 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, j) => <Skeleton key={j} className="h-4" />)}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="border border-os-line bg-os-surface p-4">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}

/* ── Small helpers ───────────────────────────────────────────────────────── */

export function Initials({ name, size = 28, className }: { name: string; size?: number; className?: string }) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center bg-iodine-wash font-sans text-[11px] uppercase tracking-wide text-os-gold-2 ring-1 ring-iodine-deep/50", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {parts.map((p) => p.charAt(0)).join("")}
    </span>
  );
}

export function ProgressRing({ value, size = 76, tone = "gold", label, sub }: { value: number; size?: number; tone?: Tone; label?: string; sub?: string }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "bad" ? "var(--color-os-crit)" : tone === "warn" ? "var(--color-os-warn)" : tone === "good" ? "var(--color-os-ok)" : "var(--color-os-gold)";
  return (
    <div className="inline-flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${pct} %`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-os-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="os-num" fill="var(--color-os-text)" fontSize={size * 0.26} fontFamily="var(--font-sans)">
          {Math.round(pct)}
        </text>
      </svg>
      {(label || sub) && (
        <div>
          {label && <p className="text-[13px] text-os-text">{label}</p>}
          {sub && <p className="mt-0.5 text-[11px] text-os-muted">{sub}</p>}
        </div>
      )}
    </div>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("border-l-2 border-os-gold/50 pl-3 text-[12px] leading-relaxed text-os-muted", className)}>{children}</p>;
}
