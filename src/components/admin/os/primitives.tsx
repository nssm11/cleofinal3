import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

export function Sheet({ children, className, padded = true, as: As = "section" }: { children: ReactNode; className?: string; padded?: boolean; as?: "section" | "div" | "article" }) {
  return <As className={cn("border border-line bg-bg", padded && "p-5", className)}>{children}</As>;
}

export function Instrument({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={cn("border border-ink bg-ink text-paper", padded && "p-5", className)}>{children}</section>;
}

export function Rule({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div aria-hidden className={cn(vertical ? "w-px self-stretch" : "h-px w-full", "bg-line", className)} />;
}

export function SectionHead({ eyebrow, title, action, sub, className }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">{eyebrow}</p>}
        <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
        {sub && <div className="mt-1 max-w-[70ch] font-sans text-[13px] leading-[1.5] text-text-secondary">{sub}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info" | "gold";

const TONE_BG: Record<Tone, string> = {
  neutral: "border-line bg-bg-2 text-text-secondary",
  good: "border-success bg-success-soft text-success",
  warn: "border-warning bg-warning-soft text-warning",
  bad: "border-error bg-error-soft text-error",
  info: "border-accent bg-accent-soft text-accent",
  gold: "border-accent bg-accent-soft text-accent",
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
  return <span title={title} className={cn("inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", TONE_BG[tone], className)}>{children}</span>;
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
  return <span className={cn("font-mono tabular-nums", className)}>{signed && millimes > 0 ? "+" : signed && millimes < 0 ? "−" : ""}{formatted} DT</span>;
}

export function Metric({ label, value, unit, sub, delta, tone = "neutral", size = "md", className, hint }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode; delta?: { value: number | null; dir: "up" | "down" | "flat"; suffix?: string; invert?: boolean }; tone?: Tone; size?: "sm" | "md" | "lg" | "xl"; className?: string; hint?: string }) {
  const sizes = { sm: "text-[16px]", md: "text-[20px]", lg: "text-[28px]", xl: "text-[36px]" } as const;
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted" title={hint}>{label}</p>
      <p className={cn("mt-2 font-sans font-semibold leading-none tracking-[-0.01em]", sizes[size])}>{value}{unit && <span className="ml-1 text-[0.6em] font-normal text-text-muted">{unit}</span>}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {delta && delta.value !== null && <Tag tone={delta.dir === "up" ? "good" : delta.dir === "down" ? "bad" : "neutral"}>{delta.dir === "up" ? "▲" : delta.dir === "down" ? "▼" : "="} {Math.abs(delta.value).toFixed(1)}%</Tag>}
        {sub && <span className="font-sans text-[11px] text-text-secondary">{sub}</span>}
      </div>
    </div>
  );
}

export function KeyValue({ items, className, dense }: { items: { label: string; value: ReactNode; hint?: string }[]; className?: string; dense?: boolean }) {
  return (
    <dl className={cn("grid gap-x-6", dense ? "gap-y-2" : "gap-y-3", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-line py-2 last:border-0">
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{it.label}</dt>
          <dd className="font-mono text-[13px] text-right" title={it.hint}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const BTN_BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.06em] border transition-colors disabled:opacity-40";
const BTN_VARIANT = {
  primary: "bg-ink text-paper border-ink hover:bg-ink-2",
  gold: "bg-accent text-paper border-accent hover:bg-accent-deep",
  ghost: "bg-bg text-ink border-line hover:border-ink",
  quiet: "bg-transparent text-text-secondary border-transparent hover:text-ink",
  danger: "bg-error-soft text-error border-error hover:bg-error hover:text-paper",
} as const;
const BTN_SIZE = { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6" } as const;

export type ButtonVariant = keyof typeof BTN_VARIANT;

export function OsButton({ children, variant = "ghost", size = "md", className, type = "button", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof BTN_SIZE }) {
  return <button type={type} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...rest}>{children}</button>;
}

export function OsLink({ children, href, variant = "ghost", size = "md", className, prefetch, title, target }: { children: ReactNode; href: string; variant?: ButtonVariant; size?: keyof typeof BTN_SIZE; className?: string; prefetch?: boolean; title?: string; target?: string }) {
  const external = /^https?:/.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  if (external) return <a href={href} target={target ?? "_blank"} rel="noopener noreferrer" title={title} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}>{children}</a>;
  return <Link href={href} prefetch={prefetch} title={title} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}>{children}</Link>;
}

export function Meter({ value, max = 100, tone = "gold", className, label }: { value: number; max?: number; tone?: Tone; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const bar = tone === "bad" ? "bg-error" : tone === "warn" ? "bg-warning" : tone === "good" ? "bg-success" : tone === "info" ? "bg-accent" : "bg-ink";
  return (
    <div className={cn("min-w-0", className)}>
      {label && <div className="mb-1 flex justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</span><span className="font-mono text-[10px]">{Math.round(pct)}%</span></div>}
      <div className="h-[2px] w-full bg-line"><div className={cn("h-full", bar)} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function RankRow({ position, label, sub, value, max, href, image }: { position: number; label: string; sub?: ReactNode; value: ReactNode; max: number; href?: string; tone?: Tone; image?: string | null }) {
  const body = (
    <div className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-3 border-b border-line last:border-0">
      <span className="font-mono text-[11px] text-text-muted">{String(position).padStart(2, "0")}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {image && <img src={image} alt="" className="h-6 w-6 object-cover border border-line" loading="lazy" />}
          <p className="truncate font-sans text-[13px]">{label}</p>
        </div>
        {sub && <p className="mt-1 truncate font-mono text-[11px] text-text-muted">{sub}</p>}
      </div>
      <span className="font-mono text-[12px]">{value}</span>
    </div>
  );
  return href ? <Link href={href} className="block hover:bg-bg-2">{body}</Link> : body;
}

export function EmptyState({ title, why, action, className }: { title: string; why: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("border border-dashed border-line p-6", className)}>
      <p className="font-sans text-[16px] font-semibold">{title}</p>
      <p className="mt-2 max-w-[60ch] font-sans text-[13px] leading-[1.5] text-text-secondary">{why}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, detail, action, technical }: { title: string; detail: string; action?: ReactNode; technical?: string }) {
  return (
    <div className="border border-error bg-error-soft p-5">
      <p className="font-sans text-[16px] font-semibold text-error">{title}</p>
      <p className="mt-2 font-sans text-[13px] leading-[1.5]">{detail}</p>
      {technical && <pre className="mt-3 max-h-32 overflow-auto border border-error/20 bg-bg p-3 font-mono text-[11px]">{technical}</pre>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("bg-bg-2 animate-pulse", className)} style={style} aria-hidden />;
}

export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: count }).map((_, i) => <div key={i} className="bg-bg p-6"><Skeleton className="h-20 w-full" /></div>)}</div>;
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return <div className="border border-line bg-bg p-4 space-y-2"><Skeleton className="h-6 w-full" />{Array.from({ length: rows }).map((_, i) => <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{Array.from({ length: cols }).map((__, j) => <Skeleton key={j} className="h-4" />)}</div>)}</div>;
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="border border-line bg-bg p-4"><Skeleton className="h-4 w-32" /><Skeleton className="mt-4 w-full" style={{ height }} /></div>;
}

export function Initials({ name, size = 28, className }: { name: string; size?: number; className?: string }) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return <span className={cn("inline-flex items-center justify-center bg-ink text-paper font-mono text-[11px] uppercase", className)} style={{ width: size, height: size }}>{parts.map((p) => p.charAt(0)).join("")}</span>;
}

export function ProgressRing({ value, size = 76, label, sub }: { value: number; size?: number; tone?: Tone; label?: string; sub?: string }) {
  return <div className="inline-flex items-center gap-3"><div className="flex h-[64px] w-[64px] items-center justify-center border border-line font-mono text-[14px]">{Math.round(value)}%</div>{(label || sub) && <div>{label && <p className="font-sans text-[13px]">{label}</p>}{sub && <p className="mt-1 font-mono text-[11px] text-text-muted">{sub}</p>}</div>}</div>;
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("border-l border-ink pl-3 font-sans text-[12px] leading-[1.5] text-text-secondary", className)}>{children}</p>;
}
