"use client";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ChatIcon, CheckIcon, LockIcon, PackageIcon, StarIcon } from "@/components/icons";
import type { AttachmentMeta, ConversationOut, MessageOut } from "@/lib/support/wire";
import { attachmentUrl, fmtTime } from "@/components/support/shared";

/* ══════════════════════════════════════════════════════════════════════════
   CHAT — the concierge's line, on the DaisyUI chat architecture.

     chat chat-start/chat-end → chat-image avatar → chat-header (name+time)
     → chat-bubble (attachments + body) → chat-footer (delivery state)

   Incoming bubbles are ivory on the page; outgoing bubbles are ink. Seen
   ticks go champagne. Runs of same-side messages group (`data-flush`) so a
   conversation reads like a conversation, not a ledger. Server truth flows
   in through props — nothing here is simulated.
   ══════════════════════════════════════════════════════════════════════════ */

function initials(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "C";
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "C") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

/** The face in the thread — maison seal for the house, initial for the guest. */
export function ChatAvatar({
  name,
  maison = false,
  online,
  size = 40,
}: {
  name: string | null | undefined;
  maison?: boolean;
  online?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn("avatar", online === true && "avatar-online", online === false && "avatar-offline", maison && "avatar-ring")}
    >
      <div
        style={{ width: size, height: size }}
        className={cn(maison && "bg-ink font-display text-[13px] italic text-champagne-3")}
        aria-hidden
      >
        {maison ? "C" : initials(name)}
      </div>
    </span>
  );
}

/** ✓ delivered to the line · ✓✓ read by the other party (champagne). */
export function ChatTicks({ status }: { status: "sent" | "read" }) {
  return (
    <span
      role="img"
      aria-label={status === "read" ? "Lu" : "Envoyé"}
      data-seen={status === "read"}
      className="inline-flex items-center"
    >
      <CheckIcon size={11} strokeWidth={3} />
      <CheckIcon size={11} strokeWidth={3} className={status === "read" ? "-ms-1.5" : "-ms-1.5 opacity-40"} />
    </span>
  );
}

/** An attachment riding inside a bubble, edge to edge. */
export function ChatAttachment({ att }: { att: AttachmentMeta }) {
  const isImage = att.mime.startsWith("image/");
  if (isImage) {
    return (
      <a href={attachmentUrl(att.key)} target="_blank" rel="noreferrer" className="chat-attachment group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachmentUrl(att.key)} alt={att.name} loading="lazy" className="transition-opacity group-hover:opacity-90" />
      </a>
    );
  }
  return (
    <a href={attachmentUrl(att.key)} target="_blank" rel="noreferrer" className="chat-file">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-champagne-soft text-champagne-2">
        <PackageIcon size={15} />
      </span>
      <span className="min-w-0">
        <span className="block max-w-[12rem] truncate font-semibold">{att.name}</span>
        <span className="block text-[10px] uppercase tracking-wider opacity-70">{(att.size / 1024).toFixed(0)} Ko · PDF</span>
      </span>
    </a>
  );
}

/** The house writing — three champagne dots on an incoming bubble. */
export function TypingBubble({ name, label }: { name: string; label: string }) {
  return (
    <div className="chat chat-start" aria-live="polite" aria-label={label}>
      <div className="chat-image">
        <ChatAvatar name={name} maison size={32} />
      </div>
      <div className="chat-header">
        {name} <time className="text-xs opacity-50">{label}</time>
      </div>
      <div className="chat-bubble">
        <span className="chat-typing-dots" aria-hidden>
          <span /> <span /> <span />
        </span>
      </div>
      <div className="chat-footer" />
    </div>
  );
}

/** A system line — centred, quiet, outside the bubbles. */
export function SystemLine({ body, at }: { body: string; at: string }) {
  return (
    <div className="flex justify-center py-1.5">
      <span className="max-w-full border border-stone/60 bg-cream/70 px-3.5 py-1.5 text-center text-[11px] italic leading-relaxed text-muted">
        {body} <span className="ms-2 whitespace-nowrap not-italic tabular-nums text-muted-2">{fmtTime(at)}</span>
      </span>
    </div>
  );
}

/** One calendar seam in the thread. */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2" aria-label={label}>
      <span aria-hidden className="h-px flex-1 bg-stone/60" />
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-stone/60" />
    </div>
  );
}

export type ChatMessageState = "sending" | "failed";

export function ChatMessage({
  m,
  mine,
  flush,
  staffName,
  youLabel,
  sentLabel,
  readLabel,
  sendingLabel,
  failedLabel,
  retryLabel,
  onRetry,
  state,
}: {
  m: MessageOut;
  mine: boolean;
  flush: boolean;
  staffName: string;
  youLabel: string;
  sentLabel: string;
  readLabel: string;
  sendingLabel: string;
  failedLabel: string;
  retryLabel: string;
  onRetry?: () => void;
  state?: ChatMessageState;
}) {
  if (m.kind === "system") return <SystemLine body={m.body} at={m.createdAt} />;
  const isNote = m.kind === "note";
  const who = mine ? youLabel : m.senderName || staffName;
  return (
    <div className={cn("chat", mine ? "chat-end" : "chat-start")} data-flush={flush || undefined}>
      <div className="chat-image">
        {/* Uniform width — grouped rows hide the avatar but keep its space,
            so every bubble in a run starts on the same line. */}
        <ChatAvatar name={who} maison={!mine} size={40} />
      </div>
      <div className="chat-header">
        {who}
        <time dateTime={m.createdAt}>{fmtTime(m.createdAt)}</time>
      </div>
      <div className={cn("chat-bubble", isNote && "!border-dashed !border-warning/60 !bg-warning-soft/70 !text-charcoal")}>
        {isNote && (
          <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-warning">
            <LockIcon size={11} /> Note interne
          </p>
        )}
        {m.attachment ? <ChatAttachment att={m.attachment} /> : null}
        {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
      </div>
      <div className="chat-footer">
        {mine && state === "sending" && <span className="italic">{sendingLabel}</span>}
        {mine && state === "failed" && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-error"
          >
            {failedLabel} — {retryLabel}
          </button>
        )}
        {mine && !state && (
          <>
            <ChatTicks status={m.status} />
            <span>{m.status === "read" ? readLabel : sentLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── conversation list ─────────────────────────────────────────────────── */

export function ConversationItem({
  t,
  active,
  typing,
  meName,
  youLabel,
  onSelect,
  timeLabel,
  statusLabel,
}: {
  t: ConversationOut;
  active: boolean;
  typing: boolean;
  meName: string | null;
  youLabel: string;
  onSelect: () => void;
  timeLabel: string;
  statusLabel: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active || undefined}
        className={cn(
          "relative flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors duration-300",
          active ? "bg-champagne-soft/50" : "hover:bg-cream/70",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 start-0 w-[2px] bg-champagne-2 transition-opacity duration-300",
            active ? "opacity-100" : "opacity-0",
          )}
        />
        <ChatAvatar name={t.subject} maison size={40} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-[13.5px]", t.unread > 0 ? "font-bold text-ink" : "font-medium text-charcoal")}>
              {t.subject}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-2">{timeLabel}</span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn("truncate text-[12px]", typing ? "italic text-champagne-2" : t.unread > 0 ? "text-charcoal" : "text-muted-2")}>
              {typing
                ? "…"
                : t.lastMessageBody
                  ? `${t.lastMessageAuthor === meName ? youLabel : t.lastMessageAuthor} : ${t.lastMessageBody.slice(0, 60)}`
                  : statusLabel}
            </span>
            {t.unread > 0 ? (
              <span className="flex h-[1.15rem] min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold tabular-nums text-paper">
                {t.unread}
              </span>
            ) : (
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  t.status === "open" ? "bg-warning" : t.status === "in_progress" ? "bg-champagne-2" : "bg-stone-2",
                )}
                aria-hidden
              />
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

export function ConversationListShell({
  title,
  count,
  emptyIcon,
  emptyText,
  newLabel,
  onNew,
  children,
}: {
  title: string;
  count: number;
  emptyIcon?: React.ReactNode;
  emptyText: string;
  newLabel: string;
  onNew: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-stone/60 px-4 py-3">
        <p className="font-display text-[16px] text-ink">{title}</p>
        {count > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums text-muted-2">{count}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <div className="border-t border-stone/60 bg-cream/50 px-4 py-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 border border-stone/70 bg-ivory px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:border-champagne-2 hover:text-champagne-2"
        >
          {emptyIcon ?? <ChatIcon size={13} />} {newLabel}
        </button>
      </div>
      <span className="sr-only">{emptyText}</span>
    </div>
  );
}

/* ── thread chrome ─────────────────────────────────────────────────────── */

export function ThreadHeader({
  subject,
  statusLabel,
  statusKind,
  orderNumber,
  conn,
  connOpen,
  connBusy,
  onBack,
}: {
  subject: string;
  statusLabel: string;
  statusKind: "open" | "progress" | "done" | "closed";
  orderNumber?: string | null;
  conn: "open" | "reconnecting" | "connecting" | "closed";
  connOpen: string;
  connBusy: string;
  onBack: () => void;
}) {
  const busy = conn === "reconnecting" || conn === "connecting";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone/60 bg-ivory px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="←"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone/70 text-muted transition-colors hover:border-champagne-2 hover:text-champagne-2 md:hidden"
        >
          <ArrowLeftIcon size={14} className="rtl-mirror" />
        </button>
        <ChatAvatar name={subject} maison size={38} online={conn === "open"} />
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] leading-tight text-ink">{subject}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.16em]",
                statusKind === "open"
                  ? "text-warning"
                  : statusKind === "progress"
                    ? "text-champagne-2"
                    : statusKind === "done"
                      ? "text-success"
                      : "text-muted-2",
              )}
            >
              {statusLabel}
            </span>
            {orderNumber && <span className="font-mono text-[10.5px] text-muted-2">{orderNumber}</span>}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold",
          conn === "open" ? "text-success" : busy ? "text-warning" : "text-muted-2",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            conn === "open" ? "bg-success" : busy ? "animate-pulse bg-warning" : "bg-stone-2",
          )}
        />
        {conn === "open" ? connOpen : busy ? connBusy : "…"}
      </span>
    </div>
  );
}

/** Five stars in the maison's hand — one tap, then the verdict stands. */
export function RateStars({ value, onRate }: { value: number | null; onRate?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5" role={onRate && value == null ? "radiogroup" : undefined} aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={value != null || !onRate}
          onClick={() => onRate?.(n)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          className={cn(
            "transition-transform duration-200",
            onRate && value == null && "hover:scale-125 active:scale-95",
            value != null && "cursor-default",
          )}
        >
          <StarIcon
            size={20}
            filled={value != null && n <= value}
            className={value != null && n <= value ? "text-champagne-2" : "text-stone-2"}
          />
        </button>
      ))}
    </div>
  );
}
