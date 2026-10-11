import type { ReactNode } from "react";

/**
 * A designed emptiness, never a forgotten one: a small projector drawn in
 * hairlines, the plain truth, and a way out.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 border border-dashed border-rule px-8 py-16 text-center">
      <svg viewBox="0 0 96 64" className="w-24 text-ash" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        {/* a projector seen from the side; its beam is a dashed hope */}
        <rect x="6" y="26" width="34" height="22" rx="3" />
        <circle cx="17" cy="17" r="7" />
        <circle cx="31" cy="17" r="7" />
        <path d="M40 32h10l14-8v24l-14-8H40" />
        <path d="M66 20 92 8M66 44 92 56" strokeDasharray="3 5" />
        <path d="M12 48v8M34 48v8" />
      </svg>
      <div>
        <h2 className="display-tight text-xl font-bold text-bone">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ash">{body}</p>
      </div>
      {action}
    </div>
  );
}
