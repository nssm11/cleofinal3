import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertKind = "success" | "warning" | "error" | "info";

export function DsAlert({ kind, title, children, className, action }: { kind: AlertKind; title?: ReactNode; children?: ReactNode; className?: string; action?: { href: string; label: string } }) {
  const tone = kind === "success" ? "border-success bg-success-soft text-success" : kind === "error" ? "border-error bg-error-soft text-error" : kind === "warning" ? "border-warning bg-warning-soft text-warning" : "border-line bg-bg-2";
  return (
    <div className={cn("border p-4 font-sans text-[13px]", tone, className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="mt-1">{children}</div>}
      {action && <Link href={action.href} className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.12em] underline">{action.label}</Link>}
    </div>
  );
}

export function Seal({ kind = "neutral", children, className }: { kind?: "neutral" | "champagne" | "gold" | "success" | "warning" | "error"; children: ReactNode; className?: string }) {
  const map: Record<string, string> = {
    neutral: "border-line bg-bg-2 text-text-secondary",
    gold: "border-ink bg-ink text-paper",
    champagne: "border-line bg-bg text-ink",
    success: "border-success bg-success-soft text-success",
    warning: "border-warning bg-warning-soft text-warning",
    error: "border-error bg-error-soft text-error",
  };
  return <span className={cn("inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", map[kind], className)}>{children}</span>;
}

export function EmptyState({ icon, title, description, action, secondary, className }: { icon?: ReactNode; title: string; description?: string; action?: { href: string; label: string }; secondary?: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn("border border-dashed border-line p-12 text-center", className)}>
      {icon && <span className="mx-auto flex h-10 w-10 items-center justify-center border border-line bg-bg-2">{icon}</span>}
      <p className="mx-auto mt-6 max-w-[32ch] font-sans text-[18px] font-semibold leading-[1.2]">{title}</p>
      {description && <p className="mx-auto mt-3 max-w-[40ch] font-sans text-[13px] leading-[1.5] text-text-secondary">{description}</p>}
      {(action || secondary) && (
        <div className="mt-8 flex justify-center gap-3">
          {action && <Link href={action.href} className="btn-primary">{action.label}</Link>}
          {secondary && <Link href={secondary.href} className="btn-ghost">{secondary.label}</Link>}
        </div>
      )}
    </div>
  );
}

export function LoadingState({ rows = 3, label, className }: { rows?: number; label?: string; className?: string }) {
  return (
    <div className={cn("space-y-px bg-line border border-line", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-bg p-4 animate-pulse"><div className="h-4 w-1/3 bg-bg-2" /><div className="mt-2 h-3 w-2/3 bg-bg-2" /></div>
      ))}
    </div>
  );
}

export function ErrorState({ title, description, retryLabel, onRetry, backHref, backLabel, className }: { title: string; description?: string; retryLabel?: string; onRetry?: () => void; backHref?: string; backLabel?: string; className?: string }) {
  return (
    <div className={cn("border border-error bg-error-soft p-8 text-center", className)}>
      <p className="font-sans text-[18px] font-semibold text-error">{title}</p>
      {description && <p className="mt-3 font-sans text-[13px]">{description}</p>}
      <div className="mt-6 flex justify-center gap-3">
        {onRetry && retryLabel && <button onClick={onRetry} className="btn-primary">{retryLabel}</button>}
        {backHref && backLabel && <Link href={backHref} className="btn-ghost">{backLabel}</Link>}
      </div>
    </div>
  );
}
