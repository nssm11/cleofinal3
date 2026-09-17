import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Rule({ className, label }: { className?: string; label?: ReactNode }) {
  if (!label) return <div aria-hidden className={cn("h-px w-full bg-line", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted shrink-0">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary", className)}>{children}</p>;
}

export function IndexMark({ n, className }: { n: string | number; className?: string }) {
  const value = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return <span className={cn("font-mono text-[12px] tracking-[0.06em]", className)}>{value}</span>;
}

export function Chapter({
  index,
  label,
  title,
  lede,
  action,
  align = "start",
  size = "h2",
  className,
  children,
}: {
  index?: string | number;
  label?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  action?: { href: string; label: string };
  tone?: "day" | "night";
  align?: "start" | "between";
  size?: "poster" | "mega" | "h1" | "h2";
  className?: string;
  children?: ReactNode;
}) {
  const sizeClass = size === "poster" ? "text-[clamp(2.5rem,8vw,6rem)] leading-[0.85] tracking-[-0.04em] font-bold" : size === "mega" ? "text-[32px] leading-[1.0] tracking-[-0.03em] font-semibold" : size === "h1" ? "text-[28px] leading-[1.1] font-semibold" : "text-[22px] leading-[1.2] font-semibold";
  return (
    <header className={cn("relative", className)}>
      <div className="flex items-baseline gap-3">
        {index !== undefined && <IndexMark n={index} />}
        {label && <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</span>}
      </div>
      <div className={cn("mt-4 flex flex-wrap items-end gap-6", align === "between" && "justify-between")}>
        <h2 className={cn("font-sans max-w-[24ch]", sizeClass)}>{title}</h2>
        {action && (
          <Link href={action.href} className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">
            {action.label} →
          </Link>
        )}
      </div>
      {lede && <p className="mt-4 max-w-[60ch] font-sans text-[15px] leading-[1.6] text-text-secondary">{lede}</p>}
      {children}
    </header>
  );
}

export function Plate({
  src,
  alt,
  ratio = "square",
  sizes = "100vw",
  priority = false,
  className,
  children,
}: {
  src: string | null;
  alt: string;
  ratio?: "square" | "portrait" | "landscape" | "wide" | "tall";
  sizes?: string;
  priority?: boolean;
  notch?: boolean;
  className?: string;
  children?: ReactNode;
  tone?: "day" | "night";
}) {
  const ratioClass = ratio === "square" ? "aspect-square" : ratio === "portrait" ? "aspect-[4/5]" : ratio === "landscape" ? "aspect-[4/3]" : ratio === "wide" ? "aspect-[16/9]" : "aspect-[2/3]";
  return (
    <div className={cn("relative overflow-hidden bg-bg-2 border border-line", ratioClass, className)}>
      {src ? <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" /> : null}
      {children}
    </div>
  );
}

export function Spec({ label, value }: { label: ReactNode; value: ReactNode; tone?: "day" | "night" }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted shrink-0">{label}</dt>
      <dd className="font-sans text-[13px] text-right">{value}</dd>
    </div>
  );
}

export function Status({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "signal" | "ok" | "warn" | "crit" | "night"; className?: string }) {
  const tones: Record<string, string> = {
    neutral: "border-line text-text-secondary bg-bg-2",
    signal: "border-accent text-accent bg-accent-soft",
    ok: "border-success text-success bg-success-soft",
    warn: "border-warning text-warning bg-warning-soft",
    crit: "border-error text-error bg-error-soft",
    night: "border-line-inverse text-text-inverse-secondary bg-transparent",
  };
  return <span className={cn("inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", tones[tone], className)}>{children}</span>;
}

export function Meter({ value, className, tone = "carbon" }: { value: number; className?: string; tone?: "carbon" | "iodine" | "ok" | "crit" }) {
  const bg = tone === "iodine" ? "bg-accent" : tone === "ok" ? "bg-success" : tone === "crit" ? "bg-error" : "bg-ink";
  return (
    <div className={cn("h-[2px] w-full bg-line", className)}>
      <div className={cn("h-full", bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SpecList({ children }: { children: ReactNode; tone?: "day" | "night" }) {
  return <dl className="font-sans text-[13px]">{children}</dl>;
}

export function Empty({ label = "Aucun résultat", title, body, action, icon, className }: { label?: ReactNode; title: ReactNode; body?: ReactNode; action?: { href: string; label: string }; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("border border-dashed border-line p-12", className)}>
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</span>
        </div>
        <p className="font-sans text-[20px] font-semibold tracking-[-0.01em]">{title}</p>
        {body && <p className="font-sans text-[14px] text-text-secondary">{body}</p>}
        {action && <Link href={action.href} className="btn-primary mt-2 self-start">{action.label}</Link>}
      </div>
    </div>
  );
}
