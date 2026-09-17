import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";

/* ══════════════════════════════════════════════════════════════════════════
   THE SURFACES KIT — the printed parts of the interface.
   Server components: a rule, a label, an index, a chapter opening, a plate,
   a specification row, a status mark. No client JavaScript is shipped for any
   of them, and every one of them reads from the tokens in globals.css.
   ══════════════════════════════════════════════════════════════════════════ */

/** A hairline that can carry a label — the recurring divider of the interface. */
export function Rule({ className, label }: { className?: string; label?: ReactNode }) {
  if (!label) return <div aria-hidden className={cn("h-px w-full bg-line", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="kicker-xs shrink-0">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/** A mono micro-cap. The default label of the house. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("kicker", className)}>{children}</p>;
}

/** The section index — 01, 02, 03 — set against a hairline. */
export function IndexMark({ n, className }: { n: string | number; className?: string }) {
  const value = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="tick text-iodine">{value}</span>
    </span>
  );
}

/**
 * CHAPTER — the opening of a section, in the house's editorial grammar:
 * an index, a label, an oversized title, an optional lede, and a place for
 * an action. Everything above the fold of a page or a band uses it, so the
 * rhythm of the site is one rhythm.
 */
export function Chapter({
  index,
  label,
  title,
  lede,
  action,
  tone = "day",
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
  const night = tone === "night";
  const sizeClass =
    size === "poster" ? "text-poster" : size === "mega" ? "text-mega" : size === "h1" ? "text-h1" : "text-h2";
  return (
    <header className={cn("relative", className)}>
      <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-2", night && "text-chalk")}>
        {index !== undefined && <IndexMark n={index} />}
        {label && (
          <span className={cn("kicker", night ? "text-chalk-muted" : "text-muted")}>{label}</span>
        )}
      </div>
      <div
        className={cn("mt-4 flex flex-wrap items-end gap-x-10 gap-y-5", align === "between" && "justify-between")}
      >
        <h2
          className={cn("font-ant max-w-[24ch] uppercase", sizeClass, night ? "text-chalk" : "text-carbon")}
        >
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className={cn("btn-ghost group shrink-0 font-mono", night ? "text-chalk" : "text-carbon")}
          >
            {action.label}
            <ArrowRightIcon size={13} className="transition-transform duration-300 group-hover:translate-x-1 rtl-mirror" />
          </Link>
        )}
      </div>
      {lede && (
        <p
          className={cn("mt-5 max-w-[62ch] text-lead", night ? "text-chalk-muted" : "text-steel")}
        >
          {lede}
        </p>
      )}
      {children}
    </header>
  );
}

/**
 * PLATE — a photographic frame. Square by default, hairline ruled, with the
 * house chamfer available where a composition needs a cut corner.
 */
export function Plate({
  src,
  alt,
  ratio = "square",
  sizes = "100vw",
  priority = false,
  notch = false,
  className,
  children,
  tone = "day",
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
  const ratioClass =
    ratio === "square"
      ? "aspect-square"
      : ratio === "portrait"
        ? "aspect-[4/5]"
        : ratio === "landscape"
          ? "aspect-[4/3]"
          : ratio === "wide"
            ? "aspect-[16/9]"
            : "aspect-[2/3]";
  return (
    <div
      className={cn("plate", ratioClass, tone === "night" ? "bg-petrol-2" : "bg-canvas-2", notch && "notch", className)}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <span aria-hidden className="blueprint absolute inset-0 opacity-40" />
      )}
      {children}
    </div>
  );
}

/** A specification row: label, value, hairline. The house's data grammar. */
export function Spec({
  label,
  value,
  tone = "day",
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "day" | "night";
}) {
  const night = tone === "night";
  return (
    <div
      className={cn("flex items-baseline justify-between gap-6 border-b py-2.5", night ? "border-night-line" : "border-line-soft")}
    >
      <dt className={cn("kicker-xs shrink-0", night && "text-chalk-faint")}>{label}</dt>
      <dd className={cn("text-meta text-end", night ? "text-chalk" : "text-carbon")}>{value}</dd>
    </div>
  );
}

/**
 * STATUS — a small state label. Health is stated, never shouted: a hairline
 * chip whose marker colour carries the meaning.
 */
export function Status({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "signal" | "ok" | "warn" | "crit" | "night";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line text-muted bg-porcelain",
    signal: "border-iodine text-iodine-deep bg-iodine-wash",
    ok: "border-ok/40 text-ok bg-ok-wash",
    warn: "border-amber/40 text-amber bg-amber-wash",
    crit: "border-crit/40 text-crit bg-crit-wash",
    night: "border-night-line text-chalk-muted bg-transparent",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em]", tones[tone], className)}
    >
      {children}
    </span>
  );
}

/** A meter — stock, progress, loyalty. A rule that fills. */
export function Meter({ value, className, tone = "carbon" }: { value: number; className?: string; tone?: "carbon" | "iodine" | "ok" | "crit" }) {
  const bg = tone === "iodine" ? "bg-iodine" : tone === "ok" ? "bg-ok" : tone === "crit" ? "bg-crit" : "bg-carbon";
  return (
    <div className={cn("h-1 w-full bg-line", className)}>
      <div className={cn("h-full transition-[width] duration-500", bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** A numbered specification list — the "fiche technique" of a product. */
export function SpecList({ children, tone = "day" }: { children: ReactNode; tone?: "day" | "night" }) {
  return <dl className={cn("text-meta", tone === "night" && "text-chalk")}>{children}</dl>;
}

/** An empty state. It says what happened, then offers the way out. */
export function Empty({
  label = "Aucun résultat",
  title,
  body,
  action,
  icon,
  className,
}: {
  label?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: { href: string; label: string };
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-line bg-porcelain p-8 sm:p-12", className)}>
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <span className="kicker-xs">{label}</span>
        </div>
        <p className="font-ant text-h3 uppercase text-carbon">{title}</p>
        {body && <p className="text-meta text-steel">{body}</p>}
        {action && (
          <Link href={action.href} className="btn-outline mt-2 self-start">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
