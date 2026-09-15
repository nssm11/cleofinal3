"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/lib/i18n/client";
import { ArrowLeftIcon, ChatIcon, CheckIcon, CloseIcon, PackageIcon, SendIcon, PlusIcon } from "@/components/icons";
import type { ConversationOut, MessageOut, PresenceOut, SupportData } from "@/lib/support/wire";
import { agoLabel, anyOnline, claimOnce, useSupportStream, type Conn } from "./hooks";
import { Bubble, PendingChip, Stars, TypingDots } from "./shared";

type ThreadMessage = MessageOut & { _state?: "sending" | "failed" };

/** The line delivers pages newest-first; the thread renders oldest-first. */
const asc = (ms: ThreadMessage[]): ThreadMessage[] => [...ms].reverse();

type Props = {
  me: { id: number; firstName: string | null; locale: string };
  tickets: ConversationOut[];
  activeId: number | null;
  thread: { messages: MessageOut[]; hasMore: boolean } | null;
  agents: PresenceOut[];
  agentsOnline: boolean;
  /** A server-validated order the customer arrived from (context only). */
  orderNumber: string | null;
};

export function ClientChat(props: Props) {
  const copy = useCopy();
  const live = copy.chat.live;
  const { me, orderNumber } = props;

  const [tickets, setTickets] = useState<ConversationOut[]>(props.tickets);
  const [activeId, setActiveId] = useState<number | null>(props.activeId);
  const [threads, setThreads] = useState<Record<number, { messages: ThreadMessage[]; hasMore: boolean; loadingOlder: boolean }>>(() => {
    if (props.activeId != null && props.thread) return { [props.activeId]: { messages: props.thread.messages, hasMore: props.thread.hasMore, loadingOlder: false } };
    return {};
  });
  const [typing, setTyping] = useState<Record<number, { who: "customer" | "support"; until: number }>>({});
  const [agents, setAgents] = useState<PresenceOut[]>(props.agents);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [pendingAtt, setPendingAtt] = useState<{ meta: { name: string; mime: string; size: number; key: string }; previewUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const active = tickets.find((t) => t.id === activeId) ?? null;
  const activeThread = activeId != null ? threads[activeId] : undefined;
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);
  const lastReportedRef = useRef(0);
  const retryRef = useRef<Map<number, { body: string; att: { name: string; mime: string; size: number; key: string } | null }>>(new Map());
  const toastSeq = useRef(1);

  const online = anyOnline(agents);

  const pushToast = useCallback((text: string) => {
    const id = toastSeq.current++;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const r = await fetch("/api/support/conversations");
      if (r.ok) {
        const d = await r.json();
        setTickets(d.tickets as ConversationOut[]);
      }
      // Reconcile the open thread with the server.
      setActiveId((aid) => {
        if (aid != null) {
          void fetch(`/api/support/messages?ticketId=${aid}&limit=40`).then((rr) => rr.json()).then((dd) => {
            if (Array.isArray(dd.messages)) setThreads((prev) => (prev[aid] ? { ...prev, [aid]: { ...prev[aid], messages: asc(dd.messages as ThreadMessage[]), hasMore: dd.hasMore } } : prev));
          });
        }
        return aid;
      });
    } catch {
      /* the next event will catch up */
    }
  }, []);

  const onData = useCallback(
    (d: SupportData) => {
      switch (d.type) {
        case "hello":
          setAgents(d.agents);
          break;
        case "presence":
          setAgents((prev) => {
            const rest = prev.filter((a) => a.id !== d.agent.id);
            return [...rest, d.agent].sort((a, b) => a.name.localeCompare(b.name));
          });
          break;
        case "typing": {
          setTyping((prev) => ({ ...prev, [d.ticketId]: { who: d.who, until: Date.now() + 4000 } }));
          break;
        }
        case "read": {
          if (d.who === "support") {
            setThreads((prev) => {
              const t = prev[d.ticketId];
              if (!t) return prev;
              return {
                ...prev,
                [d.ticketId]: {
                  ...t,
                  messages: t.messages.map((m) => (m.senderType === "customer" && m.id <= d.upToId ? { ...m, status: "read" } : m)),
                },
              };
            });
          }
          break;
        }
        case "conversation": {
          setTickets((prev) => {
            const i = prev.findIndex((t) => t.id === d.ticket.id);
            if (i === -1) return [d.ticket, ...prev];
            const next = [...prev];
            next[i] = { ...next[i], ...d.ticket };
            return next.sort((a, b) => (a.lastMessageAt ?? "").localeCompare(b.lastMessageAt ?? ""));
          });
          break;
        }
        case "message": {
          const { message: m, ticket: t } = d;
          setTickets((prev) => {
            const i = prev.findIndex((x) => x.id === t.id);
            if (i === -1) return [t, ...prev];
            const next = [...prev];
            const wasMine = m.senderId === me.id;
            next[i] = { ...next[i], ...t, unread: next[i].unread + (wasMine ? 0 : 1) };
            return next.sort((a, b) => (a.lastMessageAt ?? "").localeCompare(b.lastMessageAt ?? ""));
          });
          const mine = m.senderId === me.id;
          setThreads((prev) => {
            const th = prev[t.id];
            if (!th) return prev;
            const withoutOptimistic = mine ? th.messages.filter((x) => x.id >= 0 || x.body !== m.body) : th.messages;
            if (withoutOptimistic.some((x) => x.id === m.id)) return prev;
            return { ...prev, [t.id]: { ...th, messages: [...withoutOptimistic, m] } };
          });
          if (!mine && t.id !== activeId && claimOnce(`msg-${m.id}`)) {
            pushToast(`${copy.chat.staffName} — ${m.body.slice(0, 60)}`);
          }
          break;
        }
      }
    },
    [activeId, copy.chat.staffName, me.id, pushToast],
  );

  const conn = useSupportStream(onData, refetch);

  // Typing expiry sweep (one shared timer, not per-keystroke).
  useEffect(() => {
    if (Object.keys(typing).length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        const next: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) if (v.until > now) next[Number(k)] = v;
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [typing]);

  // Read reporting — when new messages from the other party appear in the open thread.
  useEffect(() => {
    if (!activeId || !activeThread || document.hidden) return;
    const otherIds = activeThread.messages.filter((m) => m.senderType !== "customer" && m.id > 0).map((m) => m.id);
    const maxOther = otherIds.length ? Math.max(...otherIds) : 0;
    if (maxOther > lastReportedRef.current) {
      lastReportedRef.current = maxOther;
      const ctrl = new AbortController();
      fetch("/api/support/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId, upToId: maxOther }), signal: ctrl.signal }).catch(() => {});
      return () => ctrl.abort();
    }
  }, [activeId, activeThread]);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeThread) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const last = activeThread.messages[activeThread.messages.length - 1];
    if (nearBottom || (last && last.senderId === me.id)) el.scrollTop = el.scrollHeight;
  }, [activeThread, me.id]);

  const selectTicket = useCallback((id: number) => {
    setActiveId(id);
    setMobileView("chat");
    setSubject("");
    setDraft("");
    setPendingAtt(null);
    if (!threads[id]) {
      fetch(`/api/support/messages?ticketId=${id}&limit=40`)
        .then((r) => r.json())
        .then((d) => setThreads((prev) => (prev[id] ? prev : { ...prev, [id]: { messages: asc(d.messages as ThreadMessage[]), hasMore: d.hasMore, loadingOlder: false } })))
        .catch(() => {});
    }
  }, [threads]);

  const loadOlder = useCallback(async () => {
    if (!activeId || !activeThread || !activeThread.hasMore || activeThread.loadingOlder) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const first = activeThread.messages[0];
    setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: true } }));
    try {
      const r = await fetch(`/api/support/messages?ticketId=${activeId}&beforeId=${first?.id}&limit=30`);
      const d = await r.json();
      setThreads((p) => ({
        ...p,
        [activeId]: { ...p[activeId], messages: [...asc(d.messages as ThreadMessage[]), ...p[activeId].messages], hasMore: d.hasMore, loadingOlder: false },
      }));
      requestAnimationFrame(() => {
        if (el) el.scrollTop += (el.scrollHeight - prevHeight);
      });
    } catch {
      setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: false } }));
    }
  }, [activeId, activeThread]);

  const pickFile = useCallback(
    async (f: File | undefined) => {
      if (!f) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", f);
        form.append("ticketId", activeId != null ? String(activeId) : "new");
        const r = await fetch("/api/support/upload", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) {
          pushToast(d.error === "too_big" ? live.attachmentTooBig : live.attachmentError);
          return;
        }
        const meta = d.attachment;
        setPendingAtt({ meta, previewUrl: meta.mime.startsWith("image/") ? URL.createObjectURL(f) : undefined });
      } catch {
        pushToast(live.attachmentError);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [activeId, live, pushToast],
  );

  const doSend = useCallback(
    async (body: string, att: { name: string; mime: string; size: number; key: string } | null, tempId: number) => {
      setSending(true);
      try {
        const r = await fetch("/api/support/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: activeId ?? undefined,
            body,
            subject: activeId ? undefined : subject || undefined,
            orderNumber: activeId ? undefined : orderNumber ?? undefined,
            attachment: att,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "error");
        // Swap the optimistic bubble for the server row, wherever it lives —
        // a brand-new conversation didn't have a thread key yet.
        setThreads((prev) => {
          const next: typeof prev = {};
          for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) };
          const th = next[d.ticket.id] ?? { messages: [], hasMore: false, loadingOlder: false };
          const messages = [...th.messages.filter((m) => m.id !== d.message.id), d.message as ThreadMessage].sort((a, b) => a.id - b.id);
          next[d.ticket.id] = { ...th, messages };
          return next;
        });
        setTickets((prev) => {
          const i = prev.findIndex((t) => t.id === d.ticket.id);
          if (i === -1) return [d.ticket, ...prev];
          const next = [...prev];
          next[i] = { ...next[i], ...d.ticket };
          return next;
        });
        if (d.created && activeId == null) {
          setActiveId(d.ticket.id);
          // Pull the full thread so the house's welcome note is in place.
          fetch(`/api/support/messages?ticketId=${d.ticket.id}&limit=40`)
            .then((rr) => rr.json())
            .then((dd) => setThreads((prev) => ({ ...prev, [d.ticket.id]: { messages: asc(dd.messages as ThreadMessage[]), hasMore: dd.hasMore, loadingOlder: false } })))
            .catch(() => {});
        }
        retryRef.current.delete(tempId);
      } catch {
        setThreads((prev) => {
          const next: typeof prev = {};
          for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.map((m) => (m.id === tempId ? { ...m, _state: "failed" as const } : m)) };
          return next;
        });
        retryRef.current.set(tempId, { body, att });
      } finally {
        setSending(false);
      }
    },
    [activeId, orderNumber, subject],
  );

  const send = useCallback(() => {
    const body = draft.trim();
    if ((!body && !pendingAtt) || sending) return;
    if (body.length < 2) return;
    const tempId = -Date.now();
    const local: ThreadMessage = {
      id: tempId,
      ticketId: activeId ?? tempId,
      kind: "message",
      senderType: "customer",
      senderId: me.id,
      senderName: me.firstName ?? "",
      body,
      attachment: pendingAtt?.meta ?? null,
      status: "sent",
      readAt: null,
      createdAt: new Date().toISOString(),
      _state: "sending",
    };
    const key = activeId ?? tempId;
    setThreads((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], messages: [...prev[key].messages, local] } } : { ...prev, [key]: { messages: [local], hasMore: false, loadingOlder: false } }));
    const att = pendingAtt?.meta ?? null;
    setDraft("");
    setPendingAtt(null);
    void doSend(body, att, tempId);
  }, [draft, pendingAtt, sending, activeId, me, doSend]);

  const retry = useCallback(
    (tempId: number) => {
      const payload = retryRef.current.get(tempId);
      if (!payload) return;
      setThreads((prev) => {
        for (const k of Object.keys(prev)) prev[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) };
        return prev;
      });
      void doSend(payload.body, payload.att, tempId);
    },
    [doSend],
  );

  const onDraft = useCallback(
    (v: string) => {
      setDraft(v);
      const now = Date.now();
      if (activeId && v.length > 0 && now - lastTypingRef.current > 2500) {
        lastTypingRef.current = now;
        fetch("/api/support/typing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId }) }).catch(() => {});
      }
    },
    [activeId],
  );

  const rate = useCallback(
    async (n: number) => {
      if (!active) return;
      await fetch("/api/support/rate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: active.id, rating: n }) }).catch(() => {});
      setTickets((prev) => prev.map((t) => (t.id === active.id ? { ...t, rating: n, ratedAt: new Date().toISOString() } : t)));
    },
    [active],
  );

  const statusOf = (s: ConversationOut["status"]) =>
    s === "open" ? live.statusOpen : s === "in_progress" ? live.statusInProgress : s === "resolved" ? live.statusResolved : live.statusClosed;
  const statusCls = (s: ConversationOut["status"]) =>
    s === "open" ? "text-os-warn" : s === "in_progress" ? "text-os-gold-2" : s === "resolved" ? "text-os-ok" : "text-os-faint";

  const typingNow = activeId != null && typing[activeId] ? typing[activeId].who : null;
  const shownTickets = useMemo(() => [...tickets].sort((a, b) => (a.lastMessageAt ?? a.createdAt).localeCompare(b.lastMessageAt ?? b.createdAt)), [tickets]);

  /* ── the thread view ─────────────────────────────────────────────────── */
  const thread = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-os-line-soft px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setMobileView("list")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-os-line text-os-muted transition-colors hover:bg-os-surface-2 md:hidden" aria-label="←">
            <ArrowLeftIcon size={14} className="rtl-mirror" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-[16px] text-os-ink">{active?.subject}</p>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.16em]", active ? statusCls(active.status) : "text-os-faint")}>
              {active ? statusOf(active.status) : live.newConversation}
              {active?.orderNumber && <span className="ms-2 font-mono normal-case tracking-normal text-os-faint">{active.orderNumber}</span>}
            </p>
          </div>
        </div>
        <span className={cn("flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold", conn === "open" ? "text-os-ok" : conn === "reconnecting" ? "text-os-warn" : "text-os-faint")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", conn === "open" ? "bg-os-ok" : conn === "reconnecting" ? "bg-os-warn" : "bg-os-line-strong")} />
          {conn === "open" ? live.connected : conn === "reconnecting" ? live.reconnecting : "…"}
        </span>
      </div>

      {conn === "reconnecting" && (
        <div className="border-b border-os-warn/20 bg-os-warn-soft/50 px-4 py-1.5 text-center text-[11px] text-os-warn">{live.reconnecting}</div>
      )}

      <div ref={scrollRef} className="os-scroll min-h-0 flex-1 overflow-y-auto bg-os-canvas/40 px-4 py-4 sm:px-6">
        {activeThread ? (
          <div className="mx-auto flex max-w-[44rem] flex-col gap-3">
            {activeThread.hasMore && (
              <div className="flex justify-center">
                <button onClick={() => void loadOlder()} disabled={activeThread.loadingOlder} className="rounded-full border border-os-line bg-os-surface px-4 py-1.5 text-[11px] font-semibold text-os-muted transition-colors hover:border-os-line-strong hover:text-os-text disabled:opacity-50">
                  {activeThread.loadingOlder ? "…" : live.loadOlder}
                </button>
              </div>
            )}
            {activeThread.messages.map((m) => (
              <div key={m.id} className="relative">
                <Bubble m={m} side={m.senderType === "customer" ? "me" : "them"} role="customer" />
                {m._state === "failed" && (
                  <button onClick={() => retry(m.id)} className="absolute -bottom-4 start-0 flex items-center gap-1.5 rounded-full bg-os-crit px-3 py-0.5 text-[10px] font-bold text-white">
                    {live.failed} — {live.retry}
                  </button>
                )}
              </div>
            ))}
            {typingNow === "support" && (
              <div className="flex justify-start">
                <span className="flex items-center gap-2 rounded-[10px] rounded-bl-[3px] border border-os-line bg-os-surface px-3.5 py-2.5 text-[11px] text-os-faint">
                  {live.typing} <TypingDots className="text-os-gold" />
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12.5px] text-os-faint">{live.messagePh}</p>
          </div>
        )}
      </div>

      {active && active.status === "resolved" && active.rating == null && (
        <div className="border-t border-os-line-soft bg-os-surface-2/60 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[44rem] flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-os-muted">{live.rateTitle}</p>
            <Stars value={active.rating} onRate={(n) => void rate(n)} />
          </div>
        </div>
      )}
      {active && active.status === "resolved" && active.rating != null && (
        <div className="border-t border-os-line-soft bg-os-surface-2/40 px-4 py-2 text-center text-[11px] text-os-faint sm:px-6">{live.rateThanks}</div>
      )}

      <div className="border-t border-os-line bg-os-surface px-4 py-3 sm:px-5">
        <div className="mx-auto max-w-[44rem]">
          {active?.status === "closed" && <p className="mb-2 text-[11px] italic text-os-warn">{live.reopenNote}</p>}
          {activeId == null && (
            <div className="mb-2 flex items-center gap-2">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                placeholder={live.subjectPh}
                className="field !min-h-9 flex-1 text-[13px]"
                aria-label={live.subject}
              />
            </div>
          )}
          {orderNumber && activeId == null && (
            <p className="mb-2 flex items-center gap-1.5 text-[11px] text-os-gold-2">
              <PackageIcon size={12} /> {orderNumber}
            </p>
          )}
          {pendingAtt && (
            <div className="mb-2">
              <PendingChip att={pendingAtt.meta} previewUrl={pendingAtt.previewUrl} onRemove={() => setPendingAtt(null)} busy={sending || uploading} />
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label={live.attachment}
              title={live.attachmentHint}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-os-line text-os-muted transition-colors hover:border-os-gold hover:text-os-gold disabled:opacity-50"
            >
              <PlusIcon size={16} />
            </button>
            <textarea
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={Math.min(4, Math.max(1, draft.split("\n").length))}
              placeholder={live.messagePh}
              className="field !min-h-10 max-h-32 flex-1 resize-none text-[13.5px]"
              aria-label={live.messagePh}
            />
            <button
              onClick={() => void send()}
              disabled={sending || (!draft.trim() && !pendingAtt)}
              aria-label={live.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-os-ink text-os-surface transition-colors hover:bg-os-gold-2 disabled:opacity-40"
            >
              <SendIcon size={15} className="rtl-mirror" />
            </button>
          </div>
          <p className="mt-1.5 ps-12 text-[10px] text-os-faint/70">
            {live.attachmentHint}
          </p>
        </div>
      </div>
    </div>
  );

  /* ── the conversation list ───────────────────────────────────────────── */
  const list = (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-os-line-soft px-4 py-3">
        <p className="font-display text-[15px] text-os-ink">{copy.chat.title}</p>
        {tickets.length > 0 && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-os-faint">{tickets.length}</span>}
      </div>
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto">
        {shownTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ChatIcon size={20} className="text-os-line-strong" />
            <p className="text-[12.5px] leading-relaxed text-os-faint">{copy.chat.openHours}</p>
          </div>
        ) : (
          <ul className="divide-y divide-os-line-soft">
            {shownTickets.map((t) => {
              const isTyping = t.id in typing;
              return (
                <li key={t.id}>
                  <button onClick={() => selectTicket(t.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-os-surface-2/70", activeId === t.id && "bg-os-surface-2")}>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.status === "open" ? "bg-os-warn" : t.status === "in_progress" ? "bg-os-gold" : "bg-os-line-strong")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-[13px]", t.unread > 0 ? "font-bold text-os-ink" : "font-medium text-os-text")}>{t.subject}</span>
                        <span className="shrink-0 text-[9.5px] text-os-faint">{t.lastMessageAt ? agoLabel(t.lastMessageAt) : ""}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-[11.5px]", t.unread > 0 ? "text-os-text" : "text-os-faint")}>
                          {isTyping ? live.typing : t.lastMessageBody ? `${t.lastMessageAuthor === me.firstName ? live.you : t.lastMessageAuthor}: ${t.lastMessageBody.slice(0, 60)}` : ""}
                        </span>
                        {t.unread > 0 && <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-os-gold px-1 text-[9px] font-bold text-white">{t.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-os-line-soft bg-os-surface px-4 py-2.5">
        <button onClick={() => { setActiveId(null); setMobileView("chat"); setDraft(""); setSubject(""); setPendingAtt(null); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-os-line px-4 py-2 text-[12px] font-semibold text-os-muted transition-colors hover:border-os-gold hover:text-os-gold">
          <PlusIcon size={13} /> {live.newConversation}
        </button>
      </div>
    </div>
  );

  const presenceLine = (
    <p className="flex items-center gap-2 text-[11.5px] text-os-muted">
      <span className={cn("relative flex h-2 w-2", online ? "text-os-ok" : "text-os-line-strong")}>
        {online && <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-os-ok opacity-50 motion-reduce:animate-none" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", online ? "bg-os-ok" : "bg-os-line-strong")} />
      </span>
      {online ? (agents.filter((a) => a.status !== "offline").map((a) => a.name).join(" · ")) : live.offline}
    </p>
  );

  return (
    <div className="mx-auto max-w-[62rem]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">{presenceLine}</div>
      {/* desktop: two panes; mobile: one at a time */}
      <div className="flex h-[62vh] min-h-[460px] overflow-hidden rounded-[14px] border border-os-line bg-os-surface shadow-os-sheet">
        <div className={cn("w-full flex-col border-e border-os-line md:flex md:w-[290px] lg:w-[320px]", mobileView === "list" ? "flex" : "hidden")}>{list}</div>
        <div className={cn("min-w-0 flex-1 flex-col md:flex", mobileView === "chat" ? "flex" : "hidden")}>
          {active ? thread : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <ChatIcon size={22} className="text-os-line-strong" />
              <p className="text-[13px] text-os-faint">{live.messagePh}</p>
            </div>
          )}
        </div>
      </div>
      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 start-1/2 z-50 flex w-[min(24rem,90vw)] -translate-x-1/2 flex-col gap-2 rtl:translate-x-1/2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-[10px] border border-os-line bg-os-ink px-4 py-2.5 text-[12px] text-os-surface shadow-os-lift">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
