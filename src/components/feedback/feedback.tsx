import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WarningIcon, CheckIcon, CloseIcon, InfoIcon } from "@/components/icons";

/* ══════════════════════════════════════════════════════════════════════════
   FEEDBACK — the house's voices for news, emptiness and failure.

   DsAlert speaks the DaisyUI alert architecture (`alert alert-success` …)
   in the maison's own materials. EmptyState / LoadingState / ErrorState
   are the three waiting rooms every page draws from instead of inventing
   its own. All server-safe; motion is a whisper, never a show.
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
      <Icon size={20} aria-hidden />
      <div>
        {title ? <span className="alert-title">{title}</span> : null}
        {children ? <span>{children}</span> : null}
        {action ? (
          <Link
            href={action.href}
            className="link-underline mt-1 inline-block text-[11px] font-bold uppercase tracking-[0.16em]"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Compact inline seal — a badge with a dot, for statuses inside rows. */
export function Seal({
  kind = "neutral",
  children,
  className,
}: {
  kind?: "neutral" | "champagne" | "gold" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge badge-dot", kind !== "neutral" && `badge-${kind}`, className)}>
      {children}
    </span>
  );
}

/**
 * The empty room — one glyph, one statement, one invitation. Used by every
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
    <div className={cn("px-6 py-14 text-center sm:py-16", className)}>
      {icon ? (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-iodine/40 bg-iodine-wash/60 text-iodine">
          {icon}
        </span>
      ) : null}
      <p className="mx-auto mt-6 max-w-md font-sans text-[clamp(1.3rem,3vw,1.7rem)] leading-snug text-carbon">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action || secondary ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {action ? (
            <Link href={action.href} className="btn-solid">
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="btn-ghost">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The loading room — skeleton rows that match the list they stand in for. */
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
    <div className={cn("animate-pulse px-1 py-2", className)} role="status" aria-label={label ?? "Chargement"}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-line/50 py-4 last:border-0">
          <span className="h-11 w-11 shrink-0 rounded-full bg-canvas-2" aria-hidden />
          <span className="flex-1 space-y-2.5 py-1" aria-hidden>
            <span className="block h-2.5 w-1/4 bg-canvas-2" />
            <span className="block h-3 w-3/4 bg-porcelain" />
            <span className="block h-2.5 w-1/2 bg-porcelain" />
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
    <div className={cn("px-6 py-14 text-center", className)} role="alert">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-crit/30 bg-crit-wash text-crit">
        <WarningIcon size={22} aria-hidden />
      </span>
      <p className="mx-auto mt-6 max-w-md font-sans text-[clamp(1.3rem,3vw,1.7rem)] text-carbon">{title}</p>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">{description}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {onRetry && retryLabel ? (
          <button type="button" onClick={onRetry} className="btn-solid">
            {retryLabel}
          </button>
        ) : null}
        {backHref && backLabel ? (
          <Link href={backHref} className="btn-ghost">
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
