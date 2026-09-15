"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, CloseIcon, LockIcon, PackageIcon, StarIcon } from "@/components/icons";
import type { AttachmentMeta, MessageOut } from "@/lib/support/wire";
import { fmtTime } from "./hooks";

export { fmtTime };

/** The authed delivery URL for a stored attachment. */
export function attachmentUrl(key: string): string {
  const [t, f] = key.split("/");
  return `/api/support/attachment/${t}/${f}`;
}

/* ── read ticks — only states we can honestly track ───────────────────── */
/** ✓ delivered to the line · ✓✓ read by the other party (gold). */
export function Ticks({ status, className }: { status: "sent" | "read"; className?: string }) {
  return (
    <span aria-label={status === "read" ? "Lu" : "Envoyé"} className={cn("inline-flex items-center gap-px", status === "read" ? "text-os-gold" : "text-os-faint", className)}>
      <CheckIcon size={10} strokeWidth={3} />
      <CheckIcon size={10} strokeWidth={3} className={status === "read" ? "" : "-ml-1.5 opacity-50"} />
    </span>
  );
}

/* ── the typing indicator — three dots, nothing more ──────────────────── */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      <span className="h-[4px] w-[4px] animate-bounce rounded-full bg-current [animation-delay:0ms]" />
      <span className="h-[4px] w-[4px] animate-bounce rounded-full bg-current [animation-delay:120ms]" />
      <span className="h-[4px] w-[4px] animate-bounce rounded-full bg-current [animation-delay:240ms]" />
    </span>
  );
}

/* ── attachment — image preview or a document line ────────────────────── */
export function AttachmentView({ att }: { att: AttachmentMeta }) {
  const isImage = att.mime.startsWith("image/");
  if (isImage) {
    return (
      <a href={attachmentUrl(att.key)} target="_blank" rel="noreferrer" className="group block max-w-[220px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachmentUrl(att.key)}
          alt={att.name}
          className="max-h-[180px] w-auto rounded-[6px] border border-os-line object-cover transition-opacity group-hover:opacity-90"
        />
        <p className="mt-1 truncate text-[10.5px] text-os-faint">{att.name}</p>
      </a>
    );
  }
  return (
    <a href={attachmentUrl(att.key)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-[6px] border border-os-line bg-os-surface-2 px-3 py-2 transition-colors hover:border-os-line-strong">
      <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-os-gold-soft text-os-gold-2">
        <PackageIcon size={15} />
      </span>
      <span className="min-w-0">
        <span className="block max-w-[180px] truncate text-[12px] font-semibold text-os-text">{att.name}</span>
        <span className="block text-[10px] uppercase tracking-wider text-os-faint">{(att.size / 1024).toFixed(0)} Ko · PDF</span>
      </span>
    </a>
  );
}

/* ── one message in the thread ────────────────────────────────────────── */
export type BubbleSide = "me" | "them";

export function Bubble({ m, side, role }: { m: MessageOut; side: BubbleSide; role: "customer" | "staff" }) {
  const mine = side === "me";

  if (m.kind === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full border border-os-line-soft bg-os-surface-2 px-3 py-1 text-[10.5px] italic text-os-faint">
          {m.body}
          <span className="ml-2 not-italic text-os-faint/60">{fmtTime(m.createdAt)}</span>
        </span>
      </div>
    );
  }

  const isNote = m.kind === "note";
  const bubbleCls = isNote
    ? "border border-dashed border-os-warn/60 bg-os-warn-soft/70 text-os-text"
    : mine
      ? "bg-os-ink text-os-surface"
      : "border border-os-line bg-os-surface text-os-text";

  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start", isNote && "mx-2")}>
      <div className={cn("max-w-[86%] sm:max-w-[70%]", isNote && "w-full max-w-[92%] sm:max-w-[80%]")}>
        <div className={cn("rounded-[10px] px-3.5 py-2.5", bubbleCls, mine && "rounded-br-[3px]", !mine && !isNote && "rounded-bl-[3px]")}>
          {isNote && (
            <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-os-warn">
              <LockIcon size={11} /> Note interne — invisible pour le client
            </p>
          )}
          {!isNote && !mine && (
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-os-gold-2">Cléopâtre Support</p>
          )}
          {m.attachment && (
            <div className={cn(mine && "mb-1.5")}>
              <AttachmentView att={m.attachment} />
            </div>
          )}
          <p className={cn("whitespace-pre-wrap break-words text-[13.5px] leading-relaxed", mine && "text-os-surface/95")}>{m.body}</p>
          <p className={cn("mt-1 flex items-center gap-1.5 text-[10px]", mine ? "justify-end text-os-surface/60" : "text-os-faint")}>
            {role === "staff" && isNote ? m.senderName : null}
            {fmtTime(m.createdAt)}
            {mine && <Ticks status={m.status} className="text-inherit opacity-70" />}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── the satisfaction line — five stars, one shot ─────────────────────── */
export function Stars({ value, onRate, size = 18 }: { value: number | null; onRate?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={value != null || !onRate}
          onClick={() => onRate?.(n)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          className={cn("transition-transform", onRate && value == null && "hover:scale-110 active:scale-95", value != null && "cursor-default")}
        >
          <StarIcon size={size} filled={value != null && n <= value} className={value != null && n <= value ? "text-os-gold" : "text-os-line-strong"} />
        </button>
      ))}
    </div>
  );
}

/* ── a pending attachment chip in the composer ────────────────────────── */
export function PendingChip({ att, previewUrl, onRemove, busy }: { att: AttachmentMeta; previewUrl?: string; onRemove: () => void; busy?: boolean }) {
  const isImage = att.mime.startsWith("image/");
  return (
    <span className="relative inline-flex items-center gap-2 rounded-[6px] border border-os-line bg-os-surface-2 px-2.5 py-1.5">
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-[4px] border border-os-line bg-os-surface text-os-gold">
        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <PackageIcon size={13} />
        )}
      </span>
      <span className="max-w-[140px] truncate text-[11.5px] text-os-text">{att.name}</span>
      <button type="button" onClick={onRemove} disabled={busy} aria-label="Retirer" className="text-os-faint transition-colors hover:text-os-crit disabled:opacity-40">
        <CloseIcon size={12} />
      </button>
    </span>
  );
}
