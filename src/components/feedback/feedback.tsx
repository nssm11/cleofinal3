import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WarningIcon, CheckIcon, CloseIcon, InfoIcon } from "@/components/icons";

/* ══════════════════════════════════════════════════════════════════════════
   FEEDBACK — the house's voices for news, emptiness and failure.

   DsAlert is a rule, not a box: a two-pixel spine in the colour of what it
   is telling you, a hairline, and the words. EmptyState is a room with the
   light on — one mark, one statement, one door. LoadingState is the shape of
   what is coming, never a spinner. ErrorState always offers a way back.

   All server-safe; motion is a whisper, never a show.
   ══════════════════════════════════════════════════════════════════════════ */

const ALERT_ICON = {
  success: CheckIcon,
  warning: WarningIcon,
  error: CloseIcon,
  info: InfoIcon,
} as const;

export type AlertKind = keyof typeof ALERT_ICON;

/**
 * The house's news voice. `role="alert"` is the default for errors and
 * warnings (announced at once); success/info render as `role="status"`.
 */
export function DsAlert({
  kind,
  title,
  children,
  className,
  action,
}: {
  kind: AlertKind;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  action?: { href: string; label: string };
}) {
  const Icon = ALERT_ICON[kind];
  const assertive = kind === "error" || kind === "warning";
  return (
    <div role={assertive ? "alert" : "status"} className={cn("alert", `alert-${kind}`, className)}>
      <Icon size={16} aria-hidden />
      <div>
        {title ? <span className="alert-title">{title}</span> : null}
        {children ? <span>{children}</span> : null}
        {action ? (
          <Link href={action.href} className="link-underline mt-1 inline-block font-mono text-[0.625rem] uppercase tracking-[0.16em]">
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Compact inline seal — a status as a stamped mark, for rows. */
export function Seal({
  kind = "neutral",
  children,
  className,
}: {
  kind?: "neutral" | "champagne" | "accent" | "gold" | "success" | "warning" | "error" | "info";
  children: ReactNode;
  className?: string;
}) {
  const tone = kind === "champagne" ? "accent" : kind;
  return (
    <span className={cn("badge badge-dot", tone !== "neutral" && `badge-${tone}`, className)}>
      {children}
    </span>
  );
}

/**
 * The empty room — one mark, one statement, one invitation. Used by every
 * list that can run dry (orders, favourites, notifications, search).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden px-6 py-16 text-center", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-24 bg-cinabre" />
      {icon ? (
        <span className="mx-auto flex h-14 w-14 items-center justify-center border border-rule-strong bg-bone text-ink">
          {icon}
        </span>
      ) : null}
      <p className="mx-auto mt-7 max-w-md font-display text-[clamp(1.25rem,2.6vw,1.6rem)] leading-tight text-ink text-balance">
        {title}
      </p>
      {description ? <p className="mx-auto mt-3 max-w-md text-[0.8125rem] leading-relaxed text-graphite">{description}</p> : null}
      {action || secondary ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          {action ? (
            <Link href={action.href} className="btn-solid">
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="btn-quiet">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The waiting room — the silhouette of what is loading. */
export function LoadingState({
  rows = 3,
  label,
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-1 py-2", className)} role="status" aria-label={label ?? "Chargement"}>
      <p className="loading-line mb-5">{label ?? "Chargement"}</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-rule py-4 last:border-0">
          <span className="skeleton h-11 w-11 shrink-0" aria-hidden />
          <span className="flex-1 space-y-2.5 py-1" aria-hidden>
            <span className="skeleton block h-2.5 w-1/4" />
            <span className="skeleton block h-3 w-3/4" />
            <span className="skeleton block h-2.5 w-1/2" />
          </span>
        </div>
      ))}
      <span className="sr-only">{label ?? "Chargement"}</span>
    </div>
  );
}

/** The failure room — plain words, one way back. Never a dead end. */
export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  backHref,
  backLabel,
  className,
}: {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-16 text-center", className)} role="alert">
      <span className="mx-auto flex h-14 w-14 items-center justify-center border border-error/40 bg-error-soft text-error">
        <WarningIcon size={20} aria-hidden />
      </span>
      <p className="mx-auto mt-7 max-w-md font-display text-[clamp(1.25rem,2.6vw,1.6rem)] text-ink text-balance">{title}</p>
      {description ? <p className="mx-auto mt-3 max-w-md text-[0.8125rem] leading-relaxed text-graphite">{description}</p> : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
        {onRetry && retryLabel ? (
          <button type="button" onClick={onRetry} className="btn-solid">
            {retryLabel}
          </button>
        ) : null}
        {backHref && backLabel ? (
          <Link href={backHref} className="btn-quiet">
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
