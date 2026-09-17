import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EmptyState as EmptyRoom } from "@/components/feedback/feedback";

/* ══════════════════════════════════════════════════════════════════════════
   THE PUNCTUATION OF THE HOUSE
   ──────────────────────────────────────────────────────────────────────────
   The small signs that keep a long page readable: the chapter rule, the
   breadcrumb, the field, the status seal, the empty room, the loading shape.

   The grammar is the instrument's:
     · a chapter is announced by a monospace index and a hairline that runs
       the width of the page — the title arrives on that line, not above it;
     · a status is a seal — micro-caps, a hairline, one dot of colour;
     · a field is a rule you write on;
     · a step is a numbered mark, never a row of boxes.

   Everything here is server-safe and unanimated: motion belongs to the
   composing sections (Reveal / Stagger / MaskLine), never to the punctuation.
   ══════════════════════════════════════════════════════════════════════════ */

/** The house index mark — 01, 02, 03 … in the mono voice. */
export function Mark({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("num text-[0.6875rem] leading-none text-cinabre", className)} aria-hidden>
      {children}
    </span>
  );
}

/** A hairline with an optional label riding on it — the chapter rule. */
export function Rule({
  label,
  index,
  className,
  action,
}: {
  label?: ReactNode;
  index?: ReactNode;
  className?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className={cn("flex items-center gap-4 border-b border-rule pb-3", className)}>
      {index !== undefined && <Mark>{index}</Mark>}
      {label !== undefined && <span className="micro text-ink">{label}</span>}
      <span aria-hidden className="h-px flex-1 bg-rule" />
      {action && (
        <Link href={action.href} className="group inline-flex items-center gap-1.5">
          <span className="micro text-graphite transition-colors group-hover:text-cinabre">{action.label}</span>
          <ArrowRightIcon
            size={12}
            className="text-graphite transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-cinabre rtl:rotate-180"
          />
        </Link>
      )}
    </div>
  );
}

/**
 * A chapter of the house: an index, a kicker, a Didone statement and an
 * optional invitation. The title is the graphic object; everything that
 * describes it is set small, in mono, above.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  index,
  italic,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
  index?: string;
  italic?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={cn("flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between", centered && "sm:flex-col sm:items-center", className)}>
      <div className={cn("max-w-3xl", centered && "flex flex-col items-center text-center")}>
        <p className="mb-5 flex items-center gap-4">
          {index && <span className="num text-[0.6875rem] leading-none text-cinabre">{index}</span>}
          {eyebrow && <span className="micro text-ink">{eyebrow}</span>}
        </p>
        <h2 className={cn("text-display-md font-display text-ink text-balance", italic && "italic")}>{title}</h2>
        {description && (
          <p className={cn("mt-5 max-w-xl text-[0.9375rem] leading-[1.7] text-graphite", centered && "mx-auto")}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link href={action.href} className="btn-quiet shrink-0">
          {action.label} <ArrowRightIcon size={13} className="rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}

/** Page header for interior pages — an announcement, not a masthead. */
export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  aside,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  aside?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <header className={cn("border-b border-rule pb-9", centered && "text-center")}>
      {eyebrow && <p className="micro mb-5 text-cinabre">{eyebrow}</p>}
      <div className={cn("flex flex-wrap items-end justify-between gap-8", centered && "justify-center")}>
        <h1 className={cn("text-display-lg font-display text-ink", centered && "mx-auto max-w-3xl")}>{title}</h1>
        {aside}
      </div>
      {description && (
        <p className={cn("mt-5 max-w-xl text-[0.9375rem] leading-[1.7] text-graphite", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </header>
  );
}

/** Fil d'Ariane — a rail, not a list of boxes. */
export function Breadcrumbs({ items, light }: { items: { href?: string; label: string }[]; light?: boolean }) {
  const base = light ? "text-alabaster/60" : "text-ash";
  const hover = light ? "hover:text-alabaster" : "hover:text-cinabre";
  const sep = light ? "text-alabaster/25" : "text-faint";
  return (
    <nav aria-label="Fil d'Ariane" className={cn("font-mono text-[0.625rem] uppercase tracking-[0.2em]", base)}>
      <ol className="flex flex-wrap items-center gap-2.5">
        <li>
          <Link href="/" className={cn("transition-colors", hover)}>
            Accueil
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-2.5">
            <span aria-hidden className={sep}>
              /
            </span>
            {it.href ? (
              <Link href={it.href} className={cn("transition-colors", hover)}>
                {it.label}
              </Link>
            ) : (
              <span className={light ? "text-alabaster/90" : "text-ink"} aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A meaningful empty state — the room, explained. */
export function EmptyState(props: Parameters<typeof EmptyRoom>[0]) {
  return <EmptyRoom {...props} />;
}

/** A small status sign — typographic, flat, never a pill. */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "error" | "ink" | "outline";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-rule-strong bg-alabaster text-slate",
    accent: "border-cinabre/40 bg-cinabre-soft text-cinabre-2",
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    error: "border-error/30 bg-error-soft text-error",
    ink: "border-ink bg-ink text-alabaster",
    outline: "border-current bg-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Quantity stepper — a hairline rule with two glyphs and a figure. */
export function QtyStepper({
  value,
  onChange,
  max = 20,
  min = 1,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div className={cn("inline-flex items-center border border-rule-strong bg-alabaster", h)} role="group" aria-label="Quantité">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
        className={cn("flex items-center justify-center text-ink transition-colors hover:text-cinabre disabled:opacity-25", w, h)}
      >
        <MinusIcon size={13} />
      </button>
      <span className={cn("num min-w-9 border-x border-rule text-center text-[0.875rem] text-ink", h, "leading-[--spacing] flex items-center justify-center")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className={cn("flex items-center justify-center text-ink transition-colors hover:text-cinabre disabled:opacity-25", w, h)}
      >
        <PlusIcon size={13} />
      </button>
    </div>
  );
}

/** Checkout steps — a numbered rail, lit as the order advances. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Étapes de commande">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-3">
            <span className="flex shrink-0 items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "num flex h-5 w-5 items-center justify-center border text-[0.5625rem] transition-colors duration-500",
                  done
                    ? "border-ink bg-ink text-alabaster"
                    : active
                      ? "border-cinabre bg-cinabre text-white"
                      : "border-rule-strong text-ash",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "hidden font-mono text-[0.625rem] uppercase tracking-[0.16em] transition-colors duration-500 sm:inline",
                  active ? "text-ink" : done ? "text-ink" : "text-ash",
                )}
                aria-current={active ? "step" : undefined}
              >
                {s}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className={cn("h-px flex-1 transition-colors duration-700", done ? "bg-ink" : "bg-rule")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Form field with label, hint and error. */
export function Field({
  label,
  error,
  children,
  hint,
  htmlFor,
  className,
  optional,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
  className?: string;
  optional?: string;
}) {
  return (
    <label className={cn("block text-left", className)} htmlFor={htmlFor}>
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-graphite">{label}</span>
        {optional && <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-faint">{optional}</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-2 block text-[0.75rem] text-ash">{hint}</span>}
      {error && (
        <span className="mt-2 block font-mono text-[0.6875rem] text-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

/** Loading shape for a product grid — never a spinner in the middle of a page. */
export function ProductGridSkeleton({ n = 8, rhythm = "dense" }: { n?: number; rhythm?: "dense" | "editorial" }) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-12 lg:gap-x-6",
        rhythm === "editorial" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className={cn("skeleton", rhythm === "editorial" && i === 0 ? "aspect-[16/9]" : "aspect-[4/5]")} />
          <div className="skeleton mt-4 h-2.5 w-1/4" />
          <div className="skeleton mt-3 h-4 w-4/5" />
          <div className="skeleton mt-3 h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}

/** A measured figure — the loudest thing on an instrument panel. */
export function Stat({
  value,
  label,
  hint,
  accent,
  className,
}: {
  value: ReactNode;
  label: string;
  hint?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-rule pt-4", className)}>
      <p className={cn("num text-[clamp(1.6rem,3vw,2.4rem)] leading-none", accent ? "text-cinabre" : "text-ink")}>
        {value}
      </p>
      <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-graphite">{label}</p>
      {hint && <p className="mt-1 text-[0.75rem] text-ash">{hint}</p>}
    </div>
  );
}
