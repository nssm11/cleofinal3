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
        className={cn(maison && "bg-carbon font-sans text-[13px] italic text-iodine-deep")}
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-iodine-wash text-iodine">
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
      <span className="max-w-full border border-line/60 bg-porcelain/70 px-3.5 py-1.5 text-center text-[11px] italic leading-relaxed text-muted">
        {body} <span className="ms-2 whitespace-nowrap not-italic tabular-nums text-faint">{fmtTime(at)}</span>
      </span>
    </div>
  );
}

/** One calendar seam in the thread. */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2" aria-label={label}>
      <span aria-hidden className="h-px flex-1 bg-canvas-2/60" />
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-faint">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-canvas-2/60" />
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
      <div className={cn("chat-bubble", isNote && "!border-dashed !border-amber/60 !bg-amber-wash/70 !text-steel")}>
        {isNote && (
          <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-amber">
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
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-crit"
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
          active ? "bg-iodine-wash/50" : "hover:bg-porcelain/70",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 start-0 w-[2px] bg-iodine transition-opacity duration-300",
            active ? "opacity-100" : "opacity-0",
          )}
        />
        <ChatAvatar name={t.subject} maison size={40} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-[13.5px]", t.unread > 0 ? "font-bold text-carbon" : "font-medium text-steel")}>
              {t.subject}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-faint">{timeLabel}</span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn("truncate text-[12px]", typing ? "italic text-iodine" : t.unread > 0 ? "text-steel" : "text-faint")}>
              {typing
                ? "…"
                : t.lastMessageBody
                  ? `${t.lastMessageAuthor === meName ? youLabel : t.lastMessageAuthor} : ${t.lastMessageBody.slice(0, 60)}`
                  : statusLabel}
            </span>
            {t.unread > 0 ? (
              <span className="flex h-[1.15rem] min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-carbon px-1 text-[10px] font-bold tabular-nums text-chalk">
                {t.unread}
              </span>
            ) : (
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  t.status === "open" ? "bg-amber" : t.status === "in_progress" ? "bg-iodine" : "bg-canvas-2",
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
      <div className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3">
        <p className="font-sans text-[16px] text-carbon">{title}</p>
        {count > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums text-faint">{count}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <div className="border-t border-line/60 bg-porcelain/50 px-4 py-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 border border-line/70 bg-canvas px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:border-iodine hover:text-iodine"
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
    <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-canvas px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="←"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-line/70 text-muted transition-colors hover:border-iodine hover:text-iodine md:hidden"
        >
          <ArrowLeftIcon size={14} className="rtl-mirror" />
        </button>
        <ChatAvatar name={subject} maison size={38} online={conn === "open"} />
        <div className="min-w-0">
          <p className="truncate font-sans text-[16px] leading-tight text-carbon">{subject}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.16em]",
                statusKind === "open"
                  ? "text-amber"
                  : statusKind === "progress"
                    ? "text-iodine"
                    : statusKind === "done"
                      ? "text-ok"
                      : "text-faint",
              )}
            >
              {statusLabel}
            </span>
            {orderNumber && <span className="font-mono text-[10.5px] text-faint">{orderNumber}</span>}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold",
          conn === "open" ? "text-ok" : busy ? "text-amber" : "text-faint",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            conn === "open" ? "bg-ok" : busy ? "animate-pulse bg-amber" : "bg-canvas-2",
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
            className={value != null && n <= value ? "text-iodine" : "text-line-strong"}
          />
        </button>
      ))}
    </div>
  );
}
