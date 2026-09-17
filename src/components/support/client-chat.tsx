"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import type { ConversationOut, MessageOut, PresenceOut, SupportData } from "@/lib/support/wire";
import { agoLabel, anyOnline, claimOnce, useSupportStream, type Conn } from "./hooks";

type ThreadMessage = MessageOut & { _state?: "sending" | "failed" };

const asc = (ms: ThreadMessage[]): ThreadMessage[] => [...ms].reverse();

type Props = {
  me: { id: number; firstName: string | null; locale: string };
  tickets: ConversationOut[];
  activeId: number | null;
  thread: { messages: MessageOut[]; hasMore: boolean } | null;
  agents: PresenceOut[];
  agentsOnline: boolean;
  orderNumber: string | null;
};

export function ClientChat(props: Props) {
  const { copy, locale } = useLocale();
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
      if (r.ok) { const d = await r.json(); setTickets(d.tickets as ConversationOut[]); }
      setActiveId((aid) => {
        if (aid != null) {
          void fetch(`/api/support/messages?ticketId=${aid}&limit=40`).then((rr) => rr.json()).then((dd) => {
            if (Array.isArray(dd.messages)) setThreads((prev) => (prev[aid] ? { ...prev, [aid]: { ...prev[aid], messages: asc(dd.messages as ThreadMessage[]), hasMore: dd.hasMore } } : prev));
          });
        }
        return aid;
      });
    } catch {}
  }, []);

  const onData = useCallback((d: SupportData) => {
    switch (d.type) {
      case "hello": setAgents(d.agents); break;
      case "presence": setAgents((prev) => { const rest = prev.filter((a) => a.id !== d.agent.id); return [...rest, d.agent].sort((a, b) => a.name.localeCompare(b.name)); }); break;
      case "typing": setTyping((prev) => ({ ...prev, [d.ticketId]: { who: d.who, until: Date.now() + 4000 } })); break;
      case "read": {
        if (d.who === "support") {
          setThreads((prev) => {
            const t = prev[d.ticketId];
            if (!t) return prev;
            return { ...prev, [d.ticketId]: { ...t, messages: t.messages.map((m) => (m.senderType === "customer" && m.id <= d.upToId ? { ...m, status: "read" } : m)) } };
          });
        }
        break;
      }
      case "conversation": {
        setTickets((prev) => {
          const i = prev.findIndex((t) => t.id === d.ticket.id);
          if (i === -1) return [d.ticket, ...prev];
          const next = [...prev]; next[i] = { ...next[i], ...d.ticket }; return next.sort((a, b) => (a.lastMessageAt ?? "").localeCompare(b.lastMessageAt ?? ""));
        });
        break;
      }
      case "message": {
        const { message: m, ticket: t } = d;
        setTickets((prev) => {
          const i = prev.findIndex((x) => x.id === t.id);
          if (i === -1) return [t, ...prev];
          const next = [...prev]; const wasMine = m.senderId === me.id; next[i] = { ...next[i], ...t, unread: next[i].unread + (wasMine ? 0 : 1) }; return next.sort((a, b) => (a.lastMessageAt ?? "").localeCompare(b.lastMessageAt ?? ""));
        });
        const mine = m.senderId === me.id;
        setThreads((prev) => {
          const th = prev[t.id]; if (!th) return prev;
          const withoutOptimistic = mine ? th.messages.filter((x) => x.id >= 0 || x.body !== m.body) : th.messages;
          if (withoutOptimistic.some((x) => x.id === m.id)) return prev;
          return { ...prev, [t.id]: { ...th, messages: [...withoutOptimistic, m] } };
        });
        if (!mine && t.id !== activeId && claimOnce(`msg-${m.id}`)) pushToast(`${copy.chat.staffName} — ${m.body.slice(0, 60)}`);
        break;
      }
    }
  }, [activeId, copy.chat.staffName, me.id, pushToast]);

  const conn = useSupportStream(onData, refetch);

  useEffect(() => {
    if (Object.keys(typing).length === 0) return;
    const t = setInterval(() => { const now = Date.now(); setTyping((prev) => { const next: typeof prev = {}; for (const [k, v] of Object.entries(prev)) if (v.until > now) next[Number(k)] = v; return next; }); }, 1000);
    return () => clearInterval(t);
  }, [typing]);

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

  useEffect(() => {
    const el = scrollRef.current; if (!el || !activeThread) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const last = activeThread.messages[activeThread.messages.length - 1];
    if (nearBottom || (last && last.senderId === me.id)) el.scrollTop = el.scrollHeight;
  }, [activeThread, me.id]);

  const selectTicket = useCallback((id: number) => {
    setActiveId(id); setMobileView("chat"); setSubject(""); setDraft(""); setPendingAtt(null);
    if (!threads[id]) {
      fetch(`/api/support/messages?ticketId=${id}&limit=40`).then((r) => r.json()).then((d) => setThreads((prev) => (prev[id] ? prev : { ...prev, [id]: { messages: asc(d.messages as ThreadMessage[]), hasMore: d.hasMore, loadingOlder: false } }))).catch(() => {});
    }
  }, [threads]);

  const loadOlder = useCallback(async () => {
    if (!activeId || !activeThread || !activeThread.hasMore || activeThread.loadingOlder) return;
    const el = scrollRef.current; const prevHeight = el?.scrollHeight ?? 0; const first = activeThread.messages[0];
    setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: true } }));
    try {
      const r = await fetch(`/api/support/messages?ticketId=${activeId}&beforeId=${first?.id}&limit=30`);
      const d = await r.json();
      setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], messages: [...asc(d.messages as ThreadMessage[]), ...p[activeId].messages], hasMore: d.hasMore, loadingOlder: false } }));
      requestAnimationFrame(() => { if (el) el.scrollTop += (el.scrollHeight - prevHeight); });
    } catch { setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: false } })); }
  }, [activeId, activeThread]);

  const pickFile = useCallback(async (f: File | undefined) => {
    if (!f) return; setUploading(true);
    try {
      const form = new FormData(); form.append("file", f); form.append("ticketId", activeId != null ? String(activeId) : "new");
      const r = await fetch("/api/support/upload", { method: "POST", body: form }); const d = await r.json();
      if (!r.ok) { pushToast(d.error === "too_big" ? live.attachmentTooBig : live.attachmentError); return; }
      const meta = d.attachment; setPendingAtt({ meta, previewUrl: meta.mime.startsWith("image/") ? URL.createObjectURL(f) : undefined });
    } catch { pushToast(live.attachmentError); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }, [activeId, live, pushToast]);

  const doSend = useCallback(async (body: string, att: { name: string; mime: string; size: number; key: string } | null, tempId: number) => {
    setSending(true);
    try {
      const r = await fetch("/api/support/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId ?? undefined, body, subject: activeId ? undefined : subject || undefined, orderNumber: activeId ? undefined : orderNumber ?? undefined, attachment: att }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "error");
      setThreads((prev) => {
        const next: typeof prev = {}; for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) };
        const th = next[d.ticket.id] ?? { messages: [], hasMore: false, loadingOlder: false }; const messages = [...th.messages.filter((m) => m.id !== d.message.id), d.message as ThreadMessage].sort((a, b) => a.id - b.id); next[d.ticket.id] = { ...th, messages }; return next;
      });
      setTickets((prev) => { const i = prev.findIndex((t) => t.id === d.ticket.id); if (i === -1) return [d.ticket, ...prev]; const next = [...prev]; next[i] = { ...next[i], ...d.ticket }; return next; });
      if (d.created && activeId == null) { setActiveId(d.ticket.id); fetch(`/api/support/messages?ticketId=${d.ticket.id}&limit=40`).then((rr) => rr.json()).then((dd) => setThreads((prev) => ({ ...prev, [d.ticket.id]: { messages: asc(dd.messages as ThreadMessage[]), hasMore: dd.hasMore, loadingOlder: false } }))).catch(() => {}); }
      retryRef.current.delete(tempId);
    } catch {
      setThreads((prev) => { const next: typeof prev = {}; for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.map((m) => (m.id === tempId ? { ...m, _state: "failed" as const } : m)) }; return next; });
      retryRef.current.set(tempId, { body, att });
    } finally { setSending(false); }
  }, [activeId, orderNumber, subject]);

  const send = useCallback(() => {
    const body = draft.trim(); if ((!body && !pendingAtt) || sending) return; if (body.length < 2) return;
    const tempId = -Date.now();
    const local: ThreadMessage = { id: tempId, ticketId: activeId ?? tempId, kind: "message", senderType: "customer", senderId: me.id, senderName: me.firstName ?? "", body, attachment: pendingAtt?.meta ?? null, status: "sent", readAt: null, createdAt: new Date().toISOString(), _state: "sending" };
    const key = activeId ?? tempId;
    setThreads((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], messages: [...prev[key].messages, local] } } : { ...prev, [key]: { messages: [local], hasMore: false, loadingOlder: false } }));
    const att = pendingAtt?.meta ?? null; setDraft(""); setPendingAtt(null); void doSend(body, att, tempId);
  }, [draft, pendingAtt, sending, activeId, me, doSend]);

  const retry = useCallback((tempId: number) => {
    const payload = retryRef.current.get(tempId); if (!payload) return;
    setThreads((prev) => { for (const k of Object.keys(prev)) prev[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) }; return prev; });
    void doSend(payload.body, payload.att, tempId);
  }, [doSend]);

  const onDraft = useCallback((v: string) => {
    setDraft(v); const now = Date.now();
    if (activeId && v.length > 0 && now - lastTypingRef.current > 2500) { lastTypingRef.current = now; fetch("/api/support/typing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId }) }).catch(() => {}); }
  }, [activeId]);

  const rate = useCallback(async (n: number) => {
    if (!active) return; await fetch("/api/support/rate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: active.id, rating: n }) }).catch(() => {});
    setTickets((prev) => prev.map((t) => (t.id === active.id ? { ...t, rating: n, ratedAt: new Date().toISOString() } : t)));
  }, [active]);

  const dayLabel = (iso: string) => {
    const d = new Date(iso); const start = new Date(); start.setHours(0, 0, 0, 0); const diff = Math.floor((start.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    if (diff <= 0) return "Aujourd'hui"; if (diff === 1) return "Hier"; return new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "long" }).format(d);
  };

  const typingNow = activeId != null && typing[activeId] ? typing[activeId].who : null;
  const shownTickets = useMemo(() => [...tickets].sort((a, b) => (a.lastMessageAt ?? a.createdAt).localeCompare(b.lastMessageAt ?? b.createdAt)), [tickets]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 border border-line bg-bg p-3">
        <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{online ? agents.filter((a) => a.status !== "offline").map((a) => a.name).join(" · ") || "En ligne" : live.offline}</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{conn === "reconnecting" ? live.reconnecting : live.connected}</span>
      </div>

      <div className="grid border border-line bg-bg lg:grid-cols-[300px_1fr] h-[66dvh] min-h-[30rem]">
        {/* List */}
        <div className={cn("flex flex-col border-r border-line bg-bg-2", mobileView === "list" ? "flex" : "hidden lg:flex")}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em]">Conversations — {tickets.length}</p>
            <button onClick={() => { setActiveId(null); setMobileView("chat"); }} className="border border-ink bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">+ Nouveau</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {shownTickets.length === 0 ? <p className="p-6 font-mono text-[11px] text-text-muted text-center">{copy.chat.openHours}</p> : shownTickets.map((t) => (
              <button key={t.id} onClick={() => selectTicket(t.id)} className={`w-full text-left p-4 hover:bg-bg ${activeId === t.id ? "bg-ink text-paper" : ""}`}>
                <p className="font-sans text-[13px] font-medium truncate">{t.subject}</p>
                <p className="mt-1 font-mono text-[11px] opacity-60 truncate">{(t as any).lastMessagePreview ?? (t as any).preview ?? ""}</p>
                <div className="mt-2 flex items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.12em] border border-line px-1.5 py-0.5">{t.status}</span><span className="font-mono text-[10px] opacity-60">{(t as any).lastMessageAt ? agoLabel((t as any).lastMessageAt) : ""}</span>{(t as any).unread > 0 && <span className="ml-auto bg-ink text-paper px-1.5 py-0.5 font-mono text-[10px]">{(t as any).unread}</span>}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("flex flex-col min-h-0", mobileView === "chat" ? "flex" : "hidden lg:flex")}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileView("list")} className="lg:hidden border border-line px-2 py-1 font-mono text-[10px]">←</button>
              <p className="font-sans text-[14px] font-medium truncate">{active?.subject ?? live.newConversation}</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{active ? active.status : ""}</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg">
            {activeThread?.hasMore && <div className="flex justify-center"><button onClick={() => void loadOlder()} disabled={activeThread.loadingOlder} className="border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">{activeThread.loadingOlder ? "…" : live.loadOlder}</button></div>}
            {activeThread?.messages.map((m, i) => {
              const prev = activeThread.messages[i - 1];
              const sameDay = prev && dayLabel(prev.createdAt) === dayLabel(m.createdAt);
              const mine = m.senderType === "customer";
              if (!sameDay) return <div key={m.id}><div className="flex justify-center my-4"><span className="border border-line bg-bg-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">{dayLabel(m.createdAt)}</span></div><div className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] border p-3 ${mine ? "bg-ink text-paper border-ink" : "bg-bg-2 border-line"}`}><p className="font-sans text-[13px] leading-[1.5] whitespace-pre-wrap">{m.body}</p>{m._state === "failed" && <button onClick={() => retry(m.id)} className="mt-2 font-mono text-[10px] underline">Réessayer</button>}</div></div></div>;
              return <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] border p-3 ${mine ? "bg-ink text-paper border-ink" : "bg-bg-2 border-line"}`}><p className="font-sans text-[13px] leading-[1.5] whitespace-pre-wrap">{m.body}</p>{m._state === "failed" && <button onClick={() => retry(m.id)} className="mt-2 font-mono text-[10px] underline">Réessayer</button>}</div></div>;
            })}
            {typingNow === "support" && <div className="flex justify-start"><div className="border border-line bg-bg-2 px-3 py-2 font-mono text-[11px] text-text-muted">… écrit</div></div>}
            {!activeThread && <p className="text-center font-mono text-[11px] text-text-muted mt-20">{live.messagePh}</p>}
          </div>

          {active?.status === "resolved" && active.rating == null && (
            <div className="border-t border-line bg-bg-2 p-3 flex items-center justify-between"><p className="font-sans text-[12px]">{live.rateTitle}</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => void rate(n)} className="h-8 w-8 border border-line hover:bg-ink hover:text-paper">★</button>)}</div></div>
          )}

          <div className="border-t border-line p-3 bg-bg-2">
            {activeId == null && <input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 200))} placeholder={live.subjectPh} className="field-swiss mb-2" />}
            {orderNumber && activeId == null && <p className="mb-2 font-mono text-[11px] text-ink">Commande {orderNumber}</p>}
            {pendingAtt && <div className="mb-2 flex items-center gap-2 border border-line bg-bg p-2"><span className="font-mono text-[11px] truncate">{pendingAtt.meta.name}</span><button onClick={() => setPendingAtt(null)} className="ml-auto font-mono text-[10px]">×</button></div>}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 w-10 border border-line flex items-center justify-center hover:border-ink">+</button>
              <textarea value={draft} onChange={(e) => onDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={1} placeholder={live.messagePh} className="field-swiss flex-1 resize-none" />
              <button onClick={() => void send()} disabled={sending || (!draft.trim() && !pendingAtt)} className="h-10 w-10 bg-ink text-paper flex items-center justify-center disabled:opacity-40">↑</button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => <div key={t.id} className="border border-ink bg-ink px-4 py-2 font-mono text-[11px] text-paper">{t.text}</div>)}
      </div>
    </div>
  );
}
