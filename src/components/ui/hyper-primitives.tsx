"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, WarningIcon, InfoIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   HYPER-PRIMITIVES — The Luxury Design System of Cléopâtre
   ──────────────────────────────────────────────────────────────────────────
   Inspired by HyperUI's minimal structural clarity, re-engineered in
   the maison's own architectural visual language:
   - Ivory / Warm Paper / Champagne / Ink palette
   - Fraunces / Newsreader Variable for statements and titles
   - Manrope / Jost for body, UI and micro-caps
   - Hairline borders (0.5-1px), generous spacing, intentional negative space
   - Server-safe, accessible, responsive
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * 01 · PAGE INTRO / EDITORIAL HEADER
 * A grand editorial page header with category/universe/section kicker,
 * display serif title, supporting text and subtle bottom hairline.
 */
export function EditorialHeader({
  kicker,
  title,
  italicTitle,
  description,
  breadcrumbs,
  actions,
  align = "left",
  className,
}: {
  kicker?: string;
  title: string;
  italicTitle?: string;
  description?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const isCentered = align === "center";
  return (
    <header
      className={cn(
        "relative border-b border-[#211B12]/10 bg-[#FAF7F0] py-12 sm:py-16 lg:py-20",
        className,
      )}
    >
      <div className="mx-auto max-w-[88rem] px-6 sm:px-8 lg:px-12">
        {/* Breadcrumb Trail */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7C5C]">
              <li>
                <Link href="/" className="transition-colors hover:text-[#211B12]">
                  Accueil
                </Link>
              </li>
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  <li aria-hidden className="text-[#8C7C5C]/50">
                    /
                  </li>
                  <li>
                    {b.href ? (
                      <Link href={b.href} className="transition-colors hover:text-[#211B12]">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-[#211B12]" aria-current="page">
                        {b.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}

        <div
          className={cn(
            "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
            isCentered && "lg:flex-col lg:items-center lg:text-center",
          )}
        >
          <div className={cn("max-w-3xl", isCentered && "mx-auto")}>
            {kicker && (
              <div
                className={cn(
                  "flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.3em] text-[#A3803F]",
                  isCentered && "justify-center",
                )}
              >
                <span>{kicker}</span>
                <span className="h-px w-6 bg-[#A3803F]/40" />
              </div>
            )}

            <h1 className="font-film mt-4 text-[clamp(2.2rem,4.8vw,3.8rem)] font-light leading-[1.08] tracking-[-0.015em] text-[#211B12]">
              {title}
              {italicTitle && <em className="italic text-[#A3803F]"> {italicTitle}</em>}
            </h1>

            {description && (
              <div className="mt-5 text-[15px] leading-relaxed text-[#5A5142] sm:text-[16px]">
                {description}
              </div>
            )}
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}

/**
 * 02 · BRAND BUTTON
 * Consistent button hierarchy matching the homepage design language:
 * - 'primary': dark noir button with gold hover, minimal and confident
 * - 'secondary': clean hairline outline with champagne hover
 * - 'gold': champagne fill with dark text
 * - 'ghost': minimal text with arrow hover glide
 */
export function BrandButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  icon,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2.5 font-bold uppercase tracking-[0.24em] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none select-none";

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-[10.5px]",
    lg: "px-8 py-3.5 text-[11px]",
  };

  const variants = {
    primary:
      "bg-[#16120C] text-[#FAF7F0] border border-[#16120C] hover:bg-[#2B2115] hover:border-[#A3803F] hover:text-[#ECD9A4]",
    secondary:
      "bg-transparent text-[#211B12] border border-[#211B12]/20 hover:border-[#A3803F] hover:bg-[#F2ECDF] hover:text-[#A3803F]",
    gold: "bg-[#A3803F] text-[#16120C] border border-[#A3803F] hover:bg-[#87662E] hover:text-[#FAF7F0]",
    ghost:
      "bg-transparent text-[#211B12] px-0! py-1! border-b border-[#211B12]/30 hover:border-[#A3803F] hover:text-[#A3803F] tracking-[0.22em]",
  };

  const classes = cn(base, sizes[size], variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        <span>{children}</span>
        {icon || (
          <ArrowRightIcon
            size={13}
            strokeWidth={1.5}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        )}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      <span>{children}</span>
      {icon || (
        <ArrowRightIcon
          size={13}
          strokeWidth={1.5}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      )}
    </button>
  );
}

/**
 * 03 · STATUS BADGE
 * Refined HyperUI-inspired status pill with hairline borders and subtle tint.
 */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: "success" | "warning" | "error" | "info" | "neutral" | "gold";
  label: string;
  className?: string;
}) {
  const styles = {
    success: "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    warning: "border-amber-600/30 bg-amber-500/10 text-amber-900",
    error: "border-rose-600/30 bg-rose-500/10 text-rose-800",
    info: "border-sky-600/30 bg-sky-500/10 text-sky-800",
    neutral: "border-[#211B12]/15 bg-[#211B12]/5 text-[#5A5142]",
    gold: "border-[#A3803F]/40 bg-[#A3803F]/10 text-[#87662E]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]",
        styles[status],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "success" && "bg-emerald-600",
          status === "warning" && "bg-amber-600",
          status === "error" && "bg-rose-600",
          status === "info" && "bg-sky-600",
          status === "neutral" && "bg-[#71664F]",
          status === "gold" && "bg-[#A3803F]",
        )}
      />
      {label}
    </span>
  );
}

/**
 * 04 · EDITORIAL METRIC CARD
 * Architectural stat block for client accounts, orders and dashboards.
 */
export function MetricCard({
  value,
  label,
  sublabel,
  icon,
  href,
}: {
  value: ReactNode;
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const content = (
    <div className="group relative flex flex-col justify-between border border-[#211B12]/10 bg-[#FFFDF9] p-6 transition-all duration-300 hover:border-[#A3803F]/50 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8C7C5C]">
          {label}
        </span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center border border-[#211B12]/10 bg-[#FAF7F0] text-[#A3803F] transition-colors group-hover:border-[#A3803F]">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-5">
        <span className="font-film text-[2.2rem] font-light leading-none tabular-nums text-[#211B12]">
          {value}
        </span>
        {sublabel && (
          <p className="mt-2 text-[12px] leading-snug text-[#71664F]">{sublabel}</p>
        )}
      </div>

      <div className="mt-6 border-t border-[#211B12]/10 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3803F] transition-transform duration-300 group-hover:translate-x-1">
          <span>Consulter</span>
          <ArrowRightIcon size={11} />
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/**
 * 05 · EDITORIAL TABS
 * Minimalist luxury tabs with underline indicator and micro-caps.
 */
export function EditorialTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-[#211B12]/10 overflow-x-auto", className)}>
      <nav aria-label="Onglets" className="flex items-center gap-6 sm:gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-4 pt-2 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-200 select-none",
                isActive
                  ? "text-[#211B12]"
                  : "text-[#8C7C5C] hover:text-[#211B12]",
              )}
              aria-selected={isActive}
              role="tab"
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "ms-2 font-mono text-[10px] tabular-nums",
                    isActive ? "text-[#A3803F]" : "text-[#8C7C5C]/60",
                  )}
                >
                  ({tab.count})
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#A3803F]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * 06 · LUXURY EMPTY STATE
 * Clean, branded empty state for dry lists (orders, favorites, cart, search).
 */
export function EditorialEmptyState({
  title,
  description,
  action,
  secondaryAction,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-[#211B12]/15 bg-[#FFFDF9] px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#A3803F]/30 bg-[#FAF7F0] text-[#A3803F]">
          {icon}
        </div>
      )}

      <h3 className="font-film mt-6 text-[clamp(1.4rem,2.8vw,1.9rem)] font-light text-[#211B12]">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#71664F]">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {action && (
            <BrandButton href={action.href} variant="primary">
              {action.label}
            </BrandButton>
          )}
          {secondaryAction && (
            <BrandButton href={secondaryAction.href} variant="secondary">
              {secondaryAction.label}
            </BrandButton>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 07 · ACCORDION ITEM
 * Refined HyperUI accordion for FAQ, advice, product usage, or legal sections.
 */
export function EditorialAccordion({
  items,
  className,
}: {
  items: Array<{ id: string; title: string; content: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-[#211B12]/10 border-y border-[#211B12]/10", className)}>
      {items.map((item) => (
        <details key={item.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-film text-[18px] font-normal text-[#211B12] transition-colors hover:text-[#A3803F] [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <span className="font-mono text-[14px] text-[#A3803F] transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-4 text-[14px] leading-relaxed text-[#5A5142]">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
