import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   THE PUNCTUATION OF THE HOUSE
   Headings, breadcrumbs, fields, empty states — the small signs that keep a
   long page readable. Everything here is server-friendly and unanimated; the
   motion belongs to the composing sections, not to the punctuation.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * A chapter of the house: a numeral, a kicker, a display statement and an
 * optional invitation. The numeral is set as an outline, never filled — it
 * marks the place without competing with the words.
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
    <div
      className={cn(
        "lab-section-heading flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "flex flex-col items-center")}>
        <p className="mb-5 flex items-center gap-4">
          {index && (
            <span className="font-display text-[15px] italic leading-none text-champagne-2">{index}</span>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </p>
        <h2
          className={cn(
            "font-display text-display-md text-ink",
            italic && "italic",
            centered && "mx-auto",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-5 max-w-xl text-[15px] leading-[1.8] text-muted", centered && "mx-auto")}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost shrink-0">
          {action.label} <ArrowRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

/** Page header for interior pages that do not need a full chapter opening. */
export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <header className={cn("lab-page-header border-b border-stone/70 pb-10", centered && "text-center")}>
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <h1 className={cn("font-display text-display-lg text-ink", centered && "mx-auto max-w-3xl")}>{title}</h1>
      {description && (
        <p className={cn("mt-5 max-w-xl text-[15px] leading-[1.8] text-muted", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </header>
  );
}

/** Fil d'Ariane — a rail, not a list of boxes. */
export function Breadcrumbs({ items, light }: { items: { href?: string; label: string }[]; light?: boolean }) {
  const base = light ? "text-paper/55" : "text-muted";
  const hover = light ? "hover:text-paper" : "hover:text-ink";
  const sep = light ? "text-paper/25" : "text-sand-2/60";
  return (
    <nav aria-label="Fil d'Ariane" className={cn("text-[10px] uppercase tracking-[0.22em]", base)}>
      <ol className="flex flex-wrap items-center gap-3">
        <li>
          <Link href="/" className={cn("transition-colors", hover)}>
            Accueil
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-3">
            <span aria-hidden className={sep}>
              /
            </span>
            {it.href ? (
              <Link href={it.href} className={cn("transition-colors", hover)}>
                {it.label}
              </Link>
            ) : (
              <span className={light ? "text-paper/85" : "text-ink"} aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * A meaningful empty state — it explains why the space is empty and what to do
 * about it, rather than apologising.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "light",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "relative overflow-hidden px-6 py-20 text-center",
        dark ? "bg-noir text-paper" : "border border-stone-2/40 bg-cream/70",
      )}
    >
      {!dark && <span aria-hidden className="marble-veil opacity-30" />}
      <div className="relative">
        <span
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center border",
            dark ? "border-paper/25 text-champagne-3" : "border-stone-2/60 text-champagne-2",
          )}
        >
          {icon}
        </span>
        <h3 className={cn("mt-7 font-display text-display-sm", dark ? "text-paper" : "text-ink")}>{title}</h3>
        {description && (
          <p className={cn("mx-auto mt-3 max-w-sm text-[14px] leading-relaxed", dark ? "text-paper/65" : "text-muted")}>
            {description}
          </p>
        )}
        {action && (
          <Link href={action.href} className={cn("mt-9", dark ? "btn-light" : "btn-secondary")}>
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
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
    neutral: "bg-stone/60 text-charcoal",
    accent: "bg-champagne-soft text-champagne-2",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    error: "bg-error-soft text-error",
    ink: "bg-ink text-paper",
    outline: "border border-current",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Quantity stepper — a hairline rule with two glyphs and a number. */
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
    <div className={cn("inline-flex items-center border border-stone-2/45", h)} role="group" aria-label="Quantité">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
        className={cn("flex items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25", w, h)}
      >
        <MinusIcon size={13} />
      </button>
      <span className="min-w-9 text-center text-[14px] tabular-nums text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className={cn("flex items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25", w, h)}
      >
        <PlusIcon size={13} />
      </button>
    </div>
  );
}

/** Checkout steps — a lit rail rather than a row of numbered boxes. */
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
                  "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                  done ? "bg-champagne-2" : active ? "bg-ink" : "bg-stone-2/70",
                )}
              />
              <span
                className={cn(
                  "hidden text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-500 sm:inline",
                  active ? "text-ink" : done ? "text-champagne-2" : "text-muted-2",
                )}
                aria-current={active ? "step" : undefined}
              >
                {s}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn("h-px flex-1 transition-colors duration-700", done ? "bg-champagne-2/70" : "bg-stone-2/50")}
              />
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
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label className={cn("block text-left", className)} htmlFor={htmlFor}>
      <span className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{label}</span>
      {children}
      {hint && !error && <span className="mt-2 block text-[12px] text-muted-2">{hint}</span>}
      {error && (
        <span className="mt-2 block text-[12px] font-medium text-error" role="alert">
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
        "grid gap-x-5 gap-y-12 lg:gap-x-7",
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
