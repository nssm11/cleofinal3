import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Chips carry selection, not decoration: squared, hairline, and only the
 * chosen one gets the lamp. Used in filters and genre tags.
 */

export function Chip({
  children,
  active = false,
  href,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-8 items-center rounded-frame border px-3 text-[13px] leading-none transition-colors duration-(--duration-flip)",
    active
      ? "border-tungsten bg-tungsten text-night font-medium"
      : "border-rule text-ash hover:border-tungsten/50 hover:text-bone",
    className,
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active || undefined}>
      {children}
    </button>
  );
}

/** License truth, shown on every plate that needs it. */
export function LicenseBadge({ license, className }: { license: "pd" | "cc-by"; className?: string }) {
  return (
    <span
      className={cn(
        "label-ar inline-flex items-center gap-1.5 rounded-frame border px-2 py-1 text-[11px]",
        license === "pd"
          ? "border-rule text-ash"
          : "border-patina/40 text-patina",
        className,
      )}
      title={license === "pd" ? "ملكية عامة — يُسمح بعرضه بحكم القانون" : "مرخّص بمشاع إبداعي مع الإسناد (CC BY)"}
    >
      <span
        aria-hidden
        className={cn("size-1.5", license === "pd" ? "rotate-45 bg-tungsten/80" : "rounded-full bg-patina")}
      />
      {license === "pd" ? "ملكية عامة" : "CC BY"}
    </span>
  );
}

export function YearPill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("nums font-mono text-sm text-ash", className)}>{children}</span>;
}
