import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  index,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
  index?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", centered && "sm:flex-col sm:items-center sm:text-center", className)}>
      <div className={cn("max-w-2xl", centered && "flex flex-col items-center")}>
        <p className="mb-4 flex items-center gap-3">
          {index && <span className="font-mono text-[11px] tracking-[0.12em] text-text-muted">{index}</span>}
          {eyebrow && <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{eyebrow}</span>}
        </p>
        <h2 className="font-sans text-[32px] font-semibold leading-[1.0] tracking-[-0.03em]">{title}</h2>
        {description && <p className={cn("mt-4 max-w-xl font-sans text-[14px] leading-[1.6] text-text-secondary", centered && "mx-auto")}>{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, align = "left" }: { eyebrow?: string; title: string; description?: string; align?: "left" | "center" }) {
  const centered = align === "center";
  return (
    <header className={cn("border-b border-line pb-10", centered && "text-center")}>
      {eyebrow && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-4">{eyebrow}</p>}
      <h1 className={cn("font-sans text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.9] tracking-[-0.04em]", centered && "mx-auto max-w-3xl")}>{title}</h1>
      {description && <p className={cn("mt-4 max-w-xl font-sans text-[14px] leading-[1.6] text-text-secondary", centered && "mx-auto")}>{description}</p>}
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[]; light?: boolean }) {
  return (
    <nav aria-label="Fil d'Ariane" className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-ink">Accueil</Link></li>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-2">
            <span>/</span>
            {it.href ? <Link href={it.href} className="hover:text-ink">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: { href: string; label: string }; tone?: "light" | "dark" }) {
  return (
    <div className="border border-dashed border-line p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-line">{icon}</div>
      <h3 className="mt-6 font-sans text-[20px] font-semibold">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-sm font-sans text-[14px] leading-[1.5] text-text-secondary">{description}</p>}
      {action && <Link href={action.href} className="btn-primary mt-6">{action.label}</Link>}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "error" | "ink" | "outline"; className?: string }) {
  const tones: Record<string, string> = {
    neutral: "border-line bg-bg-2 text-ink",
    accent: "border-accent bg-accent-soft text-accent",
    success: "border-success bg-success-soft text-success",
    warning: "border-warning bg-warning-soft text-warning",
    error: "border-error bg-error-soft text-error",
    ink: "border-ink bg-ink text-paper",
    outline: "border-ink bg-transparent text-ink",
  };
  return <span className={cn("inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", tones[tone], className)}>{children}</span>;
}

export function QtyStepper({ value, onChange, max = 20, min = 1, size = "md" }: { value: number; onChange: (v: number) => void; max?: number; min?: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div className={cn("inline-flex items-center border border-line", h)} role="group" aria-label="Quantité">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className={cn("flex items-center justify-center hover:bg-bg-2 disabled:opacity-30", h, "w-8")}>−</button>
      <span className="w-8 text-center font-mono text-[12px]">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className={cn("flex items-center justify-center hover:bg-bg-2 disabled:opacity-30", h, "w-8")}>+</button>
    </div>
  );
}

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={s} className="flex items-center gap-2 flex-1">
            <span className="flex items-center gap-2">
              <span className={cn("h-1 w-6", done ? "bg-ink" : active ? "bg-ink" : "bg-line")} />
              <span className={cn("hidden sm:inline font-mono text-[10px] uppercase tracking-[0.12em]", active ? "text-ink" : "text-text-muted")}>{s}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Field({ label, error, children, hint, htmlFor, className }: { label: string; error?: string; children: ReactNode; hint?: string; htmlFor?: string; className?: string }) {
  return (
    <label className={cn("block", className)} htmlFor={htmlFor}>
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</span>
      {children}
      {hint && !error && <span className="mt-2 block font-sans text-[12px] text-text-muted">{hint}</span>}
      {error && <span className="mt-2 block font-sans text-[12px] text-error" role="alert">{error}</span>}
    </label>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number; rhythm?: "dense" | "editorial" }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-line border border-line lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-bg p-4">
          <div className="aspect-square w-full bg-bg-2 animate-pulse" />
          <div className="mt-4 h-3 w-1/3 bg-bg-2 animate-pulse" />
          <div className="mt-2 h-4 w-3/4 bg-bg-2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
