"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  CheckIcon,
  LockIcon,
  MessageIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/icons";
import { Initials, Money, Tag } from "@/components/admin/os/primitives";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";
import type { ConversationOut, MessageOut, PresenceOut, PresenceStatus, SupportData } from "@/lib/support/wire";
import {
  agoLabel,
  askNotifications,
  chime,
  claimOnce,
  notify,
  useSupportStream,
} from "./hooks";
import { Bubble, PendingChip, Stars, TypingDots } from "./shared";

/* Client-safe mirrors of the server read models. */
export type InboxFilter = "all" | "waiting" | "mine" | "unread" | "active" | "resolved" | "closed";

export type InboxOrderOut = { id: number; number: string; status: string; paymentStatus: string; totalMillimes: number; createdAt: string; items: { name: string; quantity: number }[] };

export type InboxContext = {
  ticket: ConversationOut;
  customer: {
    id: number | null;
    name: string;
    email: string;
    since: string | null;
    loyaltyPoints: number;
    orderCount: number;
    orderTotalMillimes: number;
    subscription: boolean;
    conversationCount: number;
    recentOrders: { id: number; number: string; status: string; totalMillimes: number; createdAt: string }[];
  };
  order: InboxOrderOut | null;
};

export type InboxMetrics = {
  waiting: number;
  active: number;
  mine: number;
  unread: number;
  resolved24h: number;
  open: number;
  avgFirstResponseMin: number | null;
  avgResolutionMin: number | null;
  ratingAvg: number | null;
  team: { id: number; name: string; active: number; mine: number; resolved24h: number; avgFirstResponseMin: number | null }[];
};

type ThreadMessage = MessageOut & { _state?: "sending" | "failed" };
const asc = (ms: ThreadMessage[]): ThreadMessage[] => [...ms].reverse();

type Props = {
  me: { id: number; firstName: string | null; lastName: string | null; role: string };
  tickets: ConversationOut[];
  activeId: number | null;
  thread: { messages: MessageOut[]; hasMore: boolean } | null;
  context: InboxContext | null;
  metrics: InboxMetrics;
  agents: PresenceOut[];
  filter: InboxFilter;
  q: string;
};

const STATUS_LABEL: Record<ConversationOut["status"], string> = {
  open: "Nouvelle",
  in_progress: "En cours",
  resolved: "Résolue",
  closed: "Clos",
};
const STATUS_TONE: Record<ConversationOut["status"], "warn" | "gold" | "good" | "neutral"> = {
  open: "warn",
  in_progress: "gold",
  resolved: "good",
  closed: "neutral",
};
const PRIORITY_LABEL: Record<ConversationOut["priority"], string> = { low: "Basse", normal: "Normale", high: "Haute", urgent: "Urgente" };

export function SupportInbox(props: Props) {
  const { me } = props;
  const [tickets, setTickets] = useState<ConversationOut[]>(props.tickets);
  const [activeId, setActiveId] = useState<number | null>(props.activeId);
  const [threads, setThreads] = useState<Record<number, { messages: ThreadMessage[]; hasMore: boolean; loadingOlder: boolean }>>(() => {
    if (props.activeId != null && props.thread) return { [props.activeId]: { messages: props.thread.messages, hasMore: props.thread.hasMore, loadingOlder: false } };
    return {};
  });
  const [context, setContext] = useState<InboxContext | null>(props.context);
  const [metrics, setMetrics] = useState<InboxMetrics>(props.metrics);
  const [agents, setAgents] = useState<PresenceOut[]>(props.agents);
  const [typing, setTyping] = useState<Record<number, { who: "customer" | "support"; name: string; until: number }>>({});
  const [myStatus, setMyStatus] = useState<PresenceStatus>("online");
  const [filter, setFilter] = useState<InboxFilter>(props.filter);
  const [q, setQ] = useState(props.q);
  const [searchInput, setSearchInput] = useState(props.q);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [noteMode, setNoteMode] = useState(false);
  const [pendingAtt, setPendingAtt] = useState<{ meta: { name: string; mime: string; size: number; key: string }; previewUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported" | "idle">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );
  const [mobilePane, setMobilePane] = useState<"list" | "chat" | "customer">("list");
  const [listFilterOpen, setListFilterOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);
  const lastReportedRef = useRef(0);
  const retryRef = useRef<Map<number, { body: string; att: { name: string; mime: string; size: number; key: string } | null; note: boolean }>>(new Map());
  const toastSeq = useRef(1);

  const active = tickets.find((t) => t.id === activeId) ?? null;
  const activeThread = activeId != null ? threads[activeId] : undefined;

  const pushToast = useCallback((text: string) => {
    const id = toastSeq.current++;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const refetchThread = useCallback((tid: number) => {
    fetch(`/api/support/messages?ticketId=${tid}&limit=40`)
      .then((r) => r.json())
      .then((d) => setThreads((prev) => (prev[tid] ? { ...prev, [tid]: { ...prev[tid], messages: asc(d.messages as ThreadMessage[]), hasMore: d.hasMore } } : prev)))
      .catch(() => {});
    fetch("/api/support/context?ticketId=" + tid)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setContext(d as InboxContext))
      .catch(() => {});
  }, []);

  const refetchMetrics = useCallback(() => {
    fetch("/api/support/metrics").then((r) => (r.ok ? r.json() : null)).then((d) => d && setMetrics(d as InboxMetrics)).catch(() => {});
  }, []);

  const refetch = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (q) params.set("q", q);
    try {
      const r = await fetch(`/api/support/conversations?${params.toString()}`);
      if (r.ok) {
        const d = await r.json();
        setTickets(d.tickets as ConversationOut[]);
      }
    } catch {
      /* next event catches up */
    }
    if (activeId != null) refetchThread(activeId);
    refetchMetrics();
  }, [filter, q, activeId, refetchThread, refetchMetrics]);

  const onData = useCallback(
    (d: SupportData) => {
      switch (d.type) {
        case "hello":
          setAgents(d.agents);
          break;
        case "presence":
          setAgents((prev) => {
            const rest = prev.filter((a) => a.id !== d.agent.id);
            return [...rest, d.agent];
          });
          break;
        case "typing":
          setTyping((prev) => ({ ...prev, [d.ticketId]: { who: d.who, name: d.name, until: Date.now() + 4000 } }));
          break;
        case "read": {
          if (d.who === "customer") {
            setThreads((prev) => {
              const t = prev[d.ticketId];
              if (!t) return prev;
              return { ...prev, [d.ticketId]: { ...t, messages: t.messages.map((m) => (m.senderType === "support" && m.id <= d.upToId ? { ...m, status: "read" } : m)) } };
            });
          }
          break;
        }
        case "conversation": {
          setTickets((prev) => {
            const i = prev.findIndex((t) => t.id === d.ticket.id);
            if (i === -1) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...d.ticket };
            return next;
          });
          break;
        }
        case "message": {
          const { message: m, ticket: t } = d;
          setTickets((prev) => {
            const i = prev.findIndex((x) => x.id === t.id);
            if (i === -1) return [t, ...prev];
            const next = [...prev];
            const mine = m.senderId === me.id;
            next[i] = { ...next[i], ...t, unread: next[i].unread + (mine ? 0 : 1) };
            return next;
          });
          const mine = m.senderId === me.id;
          setThreads((prev) => {
            const th = prev[t.id];
            if (!th) return prev;
            const cleaned = mine ? th.messages.filter((x) => x.id >= 0 || x.body !== m.body) : th.messages;
            if (cleaned.some((x) => x.id === m.id)) return prev;
            return { ...prev, [t.id]: { ...th, messages: [...cleaned, m] } };
          });
          // Alert the team for a fresh customer message outside the open chat.
          if (!mine && m.senderType === "customer" && t.id !== activeId && claimOnce(`staff-${m.id}`)) {
            pushToast(`${t.customerName} — ${m.body.slice(0, 64)}`);
            if (notifPerm === "granted" && document.hidden) {
              notify(`Conciergerie — ${t.customerName}`, m.body.slice(0, 110));
              chime();
            } else if (notifPerm === "granted" && claimOnce(`chime-${m.id}`)) {
              chime();
            }
          }
          break;
        }
      }
    },
    [activeId, me.id, notifPerm, pushToast],
  );

  const conn = useSupportStream(onData, refetch);

  // Claim "online" on mount, heartbeat, release on unmount.
  const statusRef = useRef<PresenceStatus>("online");
  useEffect(() => {
    statusRef.current = myStatus;
  });
  useEffect(() => {
    const post = (status: PresenceStatus) => {
      fetch("/api/support/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
        .then((r) => r.json())
        .then((d) => d.agents && setAgents(d.agents as PresenceOut[]))
        .catch(() => {});
    };
    post("online");
    const beat = setInterval(() => {
      if (statusRef.current !== "offline") post("online");
    }, 30_000);
    return () => {
      clearInterval(beat);
      fetch("/api/support/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "offline" }) }).catch(() => {});
    };
  }, []);

  const setMyPresence = useCallback((status: PresenceStatus) => {
    setMyStatus(status);
    fetch("/api/support/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      .then((r) => r.json())
      .then((d) => d.agents && setAgents(d.agents as PresenceOut[]))
      .catch(() => {});
  }, []);

  // Typing expiry sweep (the render never checks the clock itself).
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

  // Read reporting (the customer's messages in the open thread).
  useEffect(() => {
    if (!activeId || !activeThread || document.hidden) return;
    const otherIds = activeThread.messages.filter((m) => m.senderType === "customer" && m.id > 0).map((m) => m.id);
    const maxOther = otherIds.length ? Math.max(...otherIds) : 0;
    if (maxOther > lastReportedRef.current) {
      lastReportedRef.current = maxOther;
      fetch("/api/support/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId, upToId: maxOther }) }).catch(() => {});
    }
  }, [activeId, activeThread]);

  // Auto-scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeThread) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    const last = activeThread.messages[activeThread.messages.length - 1];
    if (nearBottom || (last && last.senderId === me.id)) el.scrollTop = el.scrollHeight;
  }, [activeThread, me.id]);

  // Metrics drift — a slow, quiet refresh.
  useEffect(() => {
    const t = setInterval(refetchMetrics, 60_000);
    return () => clearInterval(t);
  }, [refetchMetrics]);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const selectTicket = useCallback(
    (id: number) => {
      setActiveId(id);
      setMobilePane("chat");
      setNoteMode(false);
      setDraft("");
      setPendingAtt(null);
      lastReportedRef.current = 0;
      if (!threads[id]) refetchThread(id);
      fetch(`/api/support/context?ticketId=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setContext(d as InboxContext)).catch(() => {});
    },
    [threads, refetchThread],
  );

  const loadOlder = useCallback(async () => {
    if (!activeId || !activeThread || !activeThread.hasMore || activeThread.loadingOlder) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const first = activeThread.messages[0];
    setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: true } }));
    try {
      const r = await fetch(`/api/support/messages?ticketId=${activeId}&beforeId=${first?.id}&limit=30`);
      const d = await r.json();
      setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], messages: [...asc(d.messages as ThreadMessage[]), ...p[activeId].messages], hasMore: d.hasMore, loadingOlder: false } }));
      requestAnimationFrame(() => {
        if (el) el.scrollTop += (el.scrollHeight - prevHeight);
      });
    } catch {
      setThreads((p) => ({ ...p, [activeId]: { ...p[activeId], loadingOlder: false } }));
    }
  }, [activeId, activeThread]);

  const pickFile = useCallback(
    async (f: File | undefined) => {
      if (!f || !activeId) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", f);
        form.append("ticketId", String(activeId));
        const r = await fetch("/api/support/upload", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) {
          pushToast(d.error === "too_big" ? "Fichier trop lourd — 5 Mo maximum." : "Fichier refusé — format ou taille.");
          return;
        }
        setPendingAtt({ meta: d.attachment, previewUrl: d.attachment.mime.startsWith("image/") ? URL.createObjectURL(f) : undefined });
      } catch {
        pushToast("Fichier refusé — format ou taille.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [activeId, pushToast],
  );

  const doSend = useCallback(
    async (body: string, att: { name: string; mime: string; size: number; key: string } | null, note: boolean, tempId: number) => {
      if (activeId == null) return;
      setSending(true);
      try {
        const r = await fetch("/api/support/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: activeId, body, kind: note ? "note" : "message", attachment: note ? null : att }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "error");
        setThreads((prev) => {
          const next: typeof prev = {};
          for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) };
          const th = next[d.ticket.id] ?? { messages: [], hasMore: false, loadingOlder: false };
          const messages = [...th.messages.filter((m) => m.id !== d.message.id), d.message as ThreadMessage].sort((a, b) => a.id - b.id);
          next[d.ticket.id] = { ...th, messages };
          return next;
        });
        setTickets((prev) => prev.map((t) => (t.id === d.ticket.id ? { ...t, ...d.ticket } : t)));
        retryRef.current.delete(tempId);
      } catch {
        setThreads((prev) => {
          const next: typeof prev = {};
          for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.map((m) => (m.id === tempId ? { ...m, _state: "failed" as const } : m)) };
          return next;
        });
        retryRef.current.set(tempId, { body, att, note });
      } finally {
        setSending(false);
      }
    },
    [activeId],
  );

  const send = useCallback(() => {
    const body = draft.trim();
    if ((!body && !pendingAtt) || sending || activeId == null) return;
    if (body.length < 1) return;
    const tempId = -Date.now();
    const note = noteMode;
    const local: ThreadMessage = {
      id: tempId,
      ticketId: activeId,
      kind: note ? "note" : "message",
      senderType: "support",
      senderId: me.id,
      senderName: `${me.firstName ?? "Conseiller"} ${me.lastName ?? ""}`.trim(),
      body,
      attachment: note ? null : pendingAtt?.meta ?? null,
      status: "sent",
      readAt: null,
      createdAt: new Date().toISOString(),
      _state: "sending",
    };
    setThreads((prev) => (prev[activeId] ? { ...prev, [activeId]: { ...prev[activeId], messages: [...prev[activeId].messages, local] } } : { ...prev, [activeId]: { messages: [local], hasMore: false, loadingOlder: false } }));
    const att = pendingAtt?.meta ?? null;
    setDraft("");
    setPendingAtt(null);
    void doSend(body, att, note, tempId);
  }, [draft, pendingAtt, sending, activeId, me, noteMode, doSend]);

  const retry = useCallback(
    (tempId: number) => {
      const payload = retryRef.current.get(tempId);
      if (!payload) return;
      setThreads((prev) => {
        const next: typeof prev = {};
        for (const k of Object.keys(prev)) next[Number(k)] = { ...prev[Number(k)], messages: prev[Number(k)].messages.filter((m) => m.id !== tempId) };
        return next;
      });
      void doSend(payload.body, payload.att, payload.note, tempId);
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

  const postConversation = useCallback(
    (payload: Record<string, unknown>) => {
      if (activeId == null) return;
      fetch("/api/support/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId, ...payload }) }).catch(() => {});
    },
    [activeId],
  );

  const assign = useCallback(
    (supportId: number | null) => {
      if (activeId == null) return;
      fetch("/api/support/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: activeId, supportId }) }).catch(() => {});
    },
    [activeId],
  );

  const enableNotifs = useCallback(async () => {
    const p = await askNotifications();
    setNotifPerm(p);
    if (p === "granted") pushToast("Alertes activées — vous serez prévenu·e des nouveaux messages.");
  }, [pushToast]);

  const typingNow = activeId != null && typing[activeId] ? typing[activeId] : null;
  const teamAgents = useMemo(() => metrics.team, [metrics]);
  const visibleTickets = useMemo(() => {
    const rank = (t: ConversationOut) => (t.unread > 0 ? 0 : 1) * 1000 + (t.priority === "urgent" ? 0 : t.priority === "high" ? 1 : 2) * 100 - (t.lastMessageAt ? new Date(t.lastMessageAt).getTime() / 1000 : 0);
    return [...tickets].sort((a, b) => rank(a) - rank(b));
  }, [tickets]);

  /* ── panels ──────────────────────────────────────────────────────────── */
  const listPanel = (
    <div className="flex min-h-0 flex-col">
      <div className="border-b border-os-line-soft px-3.5 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon size={13} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-os-faint" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.slice(0, 80))}
              placeholder="Client, n° commande, message…"
              className="w-full rounded-[8px] border border-os-line bg-os-surface-2/60 py-1.5 pe-3 ps-8 text-[12px] text-os-text outline-none transition-colors placeholder:text-os-faint/70 focus:border-os-gold"
            />
          </div>
          <button onClick={() => setListFilterOpen((v) => !v)} className={cn("rounded-[8px] border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors", listFilterOpen ? "border-os-gold bg-os-gold-soft text-os-gold-2" : "border-os-line text-os-muted hover:border-os-line-strong")}>
            {filter === "all" ? "Filtres" : filter === "waiting" ? "File" : filter === "mine" ? "Les miennes" : filter === "unread" ? "Non lues" : filter === "active" ? "En cours" : filter === "resolved" ? "Résolues" : "Closes"}
          </button>
        </div>
        {listFilterOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["all", "waiting", "mine", "unread", "active", "resolved", "closed"] as InboxFilter[]).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setListFilterOpen(false); }} className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors", filter === f ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line text-os-muted hover:border-os-line-strong")}>
                {f === "all" ? "Tout" : f === "waiting" ? "File d’attente" : f === "mine" ? "Les miennes" : f === "unread" ? "Non lues" : f === "active" ? "En cours" : f === "resolved" ? "Résolues" : "Closes"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto">
        {visibleTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <MessageIcon size={18} className="text-os-line-strong" />
            <p className="text-[12px] text-os-faint">Rien ici — la file est calme.</p>
          </div>
        ) : (
          <ul className="divide-y divide-os-line-soft">
            {visibleTickets.map((t) => {
              const isTyping = t.id in typing;
              const mine = t.assignedSupportId === me.id;
              return (
                <li key={t.id}>
                  <button onClick={() => selectTicket(t.id)} className={cn("flex w-full items-start gap-2.5 px-3.5 py-3 text-start transition-colors hover:bg-os-surface-2/70", activeId === t.id && "bg-os-gold-soft/50")}>
                    <span className="relative mt-0.5 shrink-0">
                      <Initials name={t.customerName} size={30} className={cn(t.unread > 0 ? "bg-os-ink text-os-onink" : "bg-os-surface-3 text-os-muted")} />
                      {(t.priority === "urgent" || t.priority === "high") && (
                        <span className={cn("absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-os-surface", t.priority === "urgent" ? "bg-os-crit" : "bg-os-warn")} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-[12.5px]", t.unread > 0 ? "font-bold text-os-ink" : "font-medium text-os-text")}>
                          {t.customerName}
                          {t.orderNumber && <span className="ms-1.5 font-mono text-[10px] font-normal text-os-faint">{t.orderNumber}</span>}
                        </span>
                        <span className="shrink-0 text-[9.5px] text-os-faint">{t.lastMessageAt ? agoLabel(t.lastMessageAt) : ""}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-os-faint">
                        {isTyping ? (typing[t.id].who === "customer" ? "écrit…" : `${typing[t.id].name} écrit…`) : t.lastMessageBody ? `${t.lastMessageAuthor}: ${t.lastMessageBody.slice(0, 48)}` : t.subject}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <Tag tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Tag>
                        {mine && <span className="text-[9px] font-bold uppercase tracking-wider text-os-gold-2">La mienne</span>}
                        {t.rating != null && (
                          <span className="flex items-center gap-0.5 text-[9px] text-os-gold-2">
                            <StarIcon size={9} filled /> {t.rating}/5
                          </span>
                        )}
                        {t.unread > 0 && <span className="ms-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-os-crit px-1 text-[9px] font-bold text-white">{t.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  const chatPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-os-line-soft px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setMobilePane("list")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-os-line text-os-muted transition-colors hover:bg-os-surface-2 lg:hidden" aria-label="←">
            <ArrowLeftIcon size={13} className="rtl-mirror" />
          </button>
          {active ? (
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold text-os-ink">
                <span className="truncate">{active.customerName}</span>
                <Tag tone={STATUS_TONE[active.status]}>{STATUS_LABEL[active.status]}</Tag>
                {active.priority !== "normal" && active.priority !== "low" && (
                  <Tag tone={active.priority === "urgent" ? "bad" : "warn"}>{PRIORITY_LABEL[active.priority]}</Tag>
                )}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-os-faint">
                {active.subject}
                {active.orderNumber && <span className="ms-2 font-mono">{active.orderNumber}</span>}
                {active.assignedSupportName && <span className="ms-2">· {active.assignedSupportName}</span>}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-os-faint">Choisissez une conversation</p>
          )}
        </div>
        <span className={cn("flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", conn === "open" ? "text-os-ok" : conn === "reconnecting" ? "text-os-warn" : "text-os-faint")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", conn === "open" ? "bg-os-ok" : conn === "reconnecting" ? "bg-os-warn" : "bg-os-line-strong")} />
          {conn === "open" ? "En ligne" : conn === "reconnecting" ? "Reconnexion…" : "…"}
        </span>
      </div>

      {conn === "reconnecting" && <div className="border-b border-os-warn/20 bg-os-warn-soft/50 px-4 py-1.5 text-center text-[11px] text-os-warn">Ligne en cours de reconnexion — aucun message n’est perdu.</div>}

      <div ref={scrollRef} className="os-scroll min-h-0 flex-1 overflow-y-auto bg-os-canvas/40 px-4 py-4 sm:px-5">
        {activeThread ? (
          <div className="mx-auto flex max-w-[46rem] flex-col gap-3">
            {activeThread.hasMore && (
              <div className="flex justify-center">
                <button onClick={() => void loadOlder()} disabled={activeThread.loadingOlder} className="rounded-full border border-os-line bg-os-surface px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-os-muted transition-colors hover:border-os-line-strong hover:text-os-text disabled:opacity-50">
                  {activeThread.loadingOlder ? "…" : "Messages précédents"}
                </button>
              </div>
            )}
            {activeThread.messages.map((m) => (
              <div key={m.id} className="relative">
                <Bubble m={m} side={m.senderType === "customer" ? "them" : "me"} role="staff" />
                {m._state === "failed" && (
                  <button onClick={() => retry(m.id)} className="absolute -bottom-4 end-0 flex items-center gap-1.5 rounded-full bg-os-crit px-3 py-0.5 text-[10px] font-bold text-white">
                    Non envoyé — Réessayer
                  </button>
                )}
              </div>
            ))}
            {typingNow && (
              <div className={cn("flex", typingNow.who === "customer" ? "justify-start" : "justify-end")}>
                <span className="flex items-center gap-2 rounded-[10px] border border-os-line bg-os-surface px-3.5 py-2.5 text-[11px] text-os-faint">
                  {typingNow.who === "customer" ? "Le client écrit" : `${typingNow.name} écrit`} <TypingDots className="text-os-gold" />
                </span>
              </div>
            )}
          </div>
        ) : active ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-os-faint">Chargement du fil…</p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageIcon size={20} className="text-os-line-strong" />
            <p className="text-[12px] text-os-faint">Sélectionnez une conversation pour prendre le fil.</p>
          </div>
        )}
      </div>

      {active && (
        <div className="border-t border-os-line bg-os-surface px-4 py-3">
          <div className="mx-auto max-w-[46rem]">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <select
                value={active.status}
                onChange={(e) => postConversation({ status: e.target.value })}
                className="rounded-[7px] border border-os-line bg-os-surface-2/60 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-os-muted outline-none focus:border-os-gold"
                aria-label="Statut de la conversation"
              >
                <option value="open">Nouvelle</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolue</option>
                <option value="closed">Clos</option>
              </select>
              <select
                value={active.priority}
                onChange={(e) => postConversation({ priority: e.target.value })}
                className={cn("rounded-[7px] border bg-os-surface-2/60 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider outline-none focus:border-os-gold", active.priority === "urgent" ? "border-os-crit/50 text-os-crit" : active.priority === "high" ? "border-os-warn/50 text-os-warn" : "border-os-line text-os-muted")}
                aria-label="Priorité"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
              <select
                value={active.assignedSupportId ?? ""}
                onChange={(e) => assign(e.target.value ? Number(e.target.value) : null)}
                className="max-w-[160px] rounded-[7px] border border-os-line bg-os-surface-2/60 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-os-muted outline-none focus:border-os-gold"
                aria-label="Affectation"
              >
                <option value="">Non affectée</option>
                {teamAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="ms-auto text-[10px] text-os-faint">{active.rating != null ? `Satisfaction ${active.rating}/5` : active.ratedAt ? "Évaluée" : ""}</span>
            </div>
            {active.status === "resolved" && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-os-ok/30 bg-os-ok-soft/40 px-3 py-2">
                <p className="text-[11px] text-os-ok">Conversation résolue — le client peut rouvrir en répondant.</p>
                {active.rating == null && <span className="text-[10px] text-os-faint">En attente d’évaluation client…</span>}
              </div>
            )}
            {pendingAtt && (
              <div className="mb-2">
                <PendingChip att={pendingAtt.meta} previewUrl={pendingAtt.previewUrl} onRemove={() => setPendingAtt(null)} busy={sending || uploading} />
              </div>
            )}
            <div className={cn("flex items-end gap-2 rounded-[10px] border p-2 transition-colors", noteMode ? "border-dashed border-os-warn/60 bg-os-warn-soft/40" : "border-os-line bg-os-surface-2/40")}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0])} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || noteMode}
                aria-label="Joindre"
                title="JPG, PNG, WebP, GIF ou PDF — 5 Mo max."
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-os-line text-os-muted transition-colors hover:border-os-gold hover:text-os-gold disabled:opacity-40"
              >
                <PlusIcon size={15} />
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
                placeholder={noteMode ? "Note interne — jamais envoyée au client…" : "Répondre à la conversation…"}
                className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[13px] text-os-text outline-none placeholder:text-os-faint/70"
              />
              <button
                onClick={() => setNoteMode((v) => !v)}
                className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider transition-colors", noteMode ? "border-os-warn bg-os-warn text-white" : "border-os-line text-os-muted hover:border-os-warn hover:text-os-warn")}
                title="Note interne — invisible pour le client"
              >
                <LockIcon size={11} /> Note
              </button>
              <button
                onClick={() => void send()}
                disabled={sending || (!draft.trim() && !pendingAtt)}
                aria-label="Envoyer"
                className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-40", noteMode ? "bg-os-warn" : "bg-os-ink hover:bg-os-gold-2")}
              >
                <SendIcon size={14} className="rtl-mirror" />
              </button>
            </div>
            <p className="mt-1.5 ps-12 text-[9.5px] text-os-faint/70">
              Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne{noteMode ? " · NOTE INTERNE — le client ne verra jamais ce message" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const customerPanel = (
    <div className="os-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {!context ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-[12px] text-os-faint">Aucun client sélectionné.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Initials name={context.customer.name} size={40} className="bg-os-ink text-os-onink" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-os-ink">{context.customer.name}</p>
              <a href={`mailto:${context.customer.email}`} className="block truncate text-[11.5px] text-os-gold-2 underline-offset-2 hover:underline">
                {context.customer.email}
              </a>
              {context.customer.since && <p className="mt-0.5 text-[10px] text-os-faint">Cliente depuis le {new Date(context.customer.since).toLocaleDateString("fr-TN")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Commandes", value: String(context.customer.orderCount) },
              { label: "Fidélité", value: `${context.customer.loyaltyPoints} pts` },
              { label: "Hiwars", value: String(context.customer.conversationCount + 1) },
            ].map((s) => (
              <div key={s.label} className="rounded-[10px] border border-os-line-soft bg-os-surface-2/50 px-2.5 py-2 text-center">
                <p className="os-num text-[15px] text-os-ink">{s.value}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-os-faint">{s.label}</p>
              </div>
            ))}
          </div>

          {context.customer.subscription && (
            <p className="flex items-center gap-2 rounded-[8px] border border-os-gold/30 bg-os-gold-soft/50 px-3 py-2 text-[11px] text-os-gold-2">
              <PackageIcon size={12} /> Abonnement actif
            </p>
          )}
          {context.customer.orderTotalMillimes > 0 && (
            <p className="text-[11px] text-os-faint">
              Valeur d’achat totale : <Money millimes={context.customer.orderTotalMillimes} className="text-os-text" />
            </p>
          )}

          {context.order && (
            <div className="rounded-[10px] border border-os-line bg-os-surface-2/40 p-3">
              <p className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-os-muted">
                <span className="flex items-center gap-1.5">
                  <TruckIcon size={12} /> Commande liée
                </span>
                <span className="font-mono normal-case">{context.order.number}</span>
              </p>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] text-os-muted">{ORDER_STATUS_LABELS[context.order.status as keyof typeof ORDER_STATUS_LABELS] ?? context.order.status}</span>
                <Money millimes={context.order.totalMillimes} className="text-[12px] text-os-ink" />
              </div>
              <ul className="space-y-1 border-t border-os-line-soft pt-2">
                {context.order.items.slice(0, 6).map((i) => (
                  <li key={i.name} className="flex items-baseline justify-between gap-2 text-[11.5px]">
                    <span className="truncate text-os-text">{i.name}</span>
                    <span className="shrink-0 text-os-faint">×{i.quantity}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/admin/commandes/${context.order.id}`} className="mt-2.5 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-os-gold-2 hover:underline">
                Ouvrir la commande
              </Link>
            </div>
          )}

          {context.customer.recentOrders.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-os-muted">Commandes récentes</p>
              <ul className="space-y-1.5">
                {context.customer.recentOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/commandes/${o.id}`} className="flex items-center justify-between gap-2 rounded-[8px] border border-os-line-soft bg-os-surface px-3 py-2 transition-colors hover:border-os-line-strong">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[10.5px] text-os-gold-2">{o.number}</span>
                        <span className="truncate text-[10.5px] text-os-faint">{ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}</span>
                      </span>
                      <Money millimes={o.totalMillimes} className="shrink-0 text-[11px] text-os-text" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-os-muted">Évaluation</p>
            {context.ticket.rating != null ? (
              <div className="flex items-center gap-2">
                <Stars value={context.ticket.rating} size={14} />
                <span className="text-[11px] text-os-faint">{context.ticket.rating}/5</span>
              </div>
            ) : (
              <p className="text-[11px] text-os-faint">Aucune pour le moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const onlineAgents = agents.filter((a) => a.status !== "offline");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* the ledger strip — real figures only */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-os-line bg-os-surface px-4 py-2.5">
        {[
          { label: "File", value: metrics.waiting, tone: metrics.waiting > 0 ? "text-os-warn" : "text-os-ink" },
          { label: "En cours", value: metrics.active, tone: "text-os-ink" },
          { label: "Les miennes", value: metrics.mine, tone: "text-os-gold-2" },
          { label: "Non lues", value: metrics.unread, tone: metrics.unread > 0 ? "text-os-crit" : "text-os-ink" },
          { label: "Urgentes", value: metrics.open, tone: metrics.open > 0 ? "text-os-crit" : "text-os-ink" },
          { label: "Résolues 24 h", value: metrics.resolved24h, tone: "text-os-ok" },
        ].map((s) => (
          <span key={s.label} className="flex items-baseline gap-1.5">
            <span className={cn("os-num text-[17px] leading-none", s.tone)}>{s.value}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-os-faint">{s.label}</span>
          </span>
        ))}
        <span className="hidden items-baseline gap-4 text-[10px] text-os-faint xl:flex">
          {metrics.avgFirstResponseMin != null && <span>Réponse {metrics.avgFirstResponseMin} min</span>}
          {metrics.avgResolutionMin != null && <span>Résolution {metrics.avgResolutionMin} min</span>}
          {metrics.ratingAvg != null && <span>Satisfaction {metrics.ratingAvg}/5</span>}
        </span>

        <span className="ms-auto flex items-center gap-3">
          {/* team presence */}
          <span className="hidden items-center gap-1.5 md:flex" title="L’équipe au comptoir">
            <UsersIcon size={13} className="text-os-faint" />
            {onlineAgents.length === 0 ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-os-faint">Personne au comptoir</span>
            ) : (
              onlineAgents.slice(0, 5).map((a) => (
                <span key={a.id} title={`${a.name} — ${a.status === "online" ? "en ligne" : "à l’absence"}`} className={cn("h-2 w-2 rounded-full", a.status === "online" ? "bg-os-ok" : "bg-os-warn")} />
              ))
            )}
          </span>
          {/* my status */}
          <span className="flex items-center overflow-hidden rounded-full border border-os-line">
            {(
              [
                { s: "online", label: "En ligne", dot: "bg-os-ok" },
                { s: "away", label: "Absent·e", dot: "bg-os-warn" },
                { s: "offline", label: "Hors ligne", dot: "bg-os-faint" },
              ] as { s: PresenceStatus; label: string; dot: string }[]
            ).map((x) => (
              <button key={x.s} onClick={() => setMyPresence(x.s)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors", myStatus === x.s ? "bg-os-ink text-os-onink" : "text-os-muted hover:bg-os-surface-2")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", x.dot)} /> {x.label}
              </button>
            ))}
          </span>
          {/* notifications */}
          {notifPerm !== "unsupported" && (
            <button
              onClick={() => (notifPerm === "granted" ? setNotifPerm("denied") : void enableNotifs())}
              title={notifPerm === "granted" ? "Désactiver les alertes du navigateur" : "Activer les alertes du navigateur"}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", notifPerm === "granted" ? "border-os-gold bg-os-gold-soft text-os-gold-2" : "border-os-line text-os-faint hover:border-os-line-strong")}
            >
              {notifPerm === "granted" ? <CheckIcon size={14} /> : <span className="text-[10px] font-bold">🔔</span>}
            </button>
          )}
        </span>
      </div>

      {/* the three panes */}
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] lg:grid-cols-[320px_minmax(0,1fr)_300px] lg:grid-rows-1">
        {/* mobile pane switch */}
        <div className="flex border-b border-os-line lg:hidden">
          {(
            [
              { k: "list", label: "Conversations" },
              { k: "chat", label: "Chat" },
              { k: "customer", label: "Client" },
            ] as { k: "list" | "chat" | "customer"; label: string }[]
          ).map((x) => (
            <button key={x.k} onClick={() => setMobilePane(x.k)} className={cn("flex-1 border-b-2 px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-wider transition-colors", mobilePane === x.k ? "border-os-gold text-os-ink" : "border-transparent text-os-faint")}>
              {x.label}
            </button>
          ))}
        </div>

        <div className={cn("min-h-0 border-e border-os-line bg-os-surface", mobilePane === "list" ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>{listPanel}</div>
        <div className={cn("min-h-0 bg-os-surface", mobilePane === "chat" ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>{chatPanel}</div>
        <div className={cn("min-h-0 border-s border-os-line bg-os-surface", mobilePane === "customer" ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
          {active && (
            <div className="flex items-center justify-between border-b border-os-line-soft px-4 py-3">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-os-muted">
                <UsersIcon size={12} /> Le client
              </p>
              <button onClick={() => setMobilePane("list")} className="text-[10px] font-bold uppercase tracking-wider text-os-faint lg:hidden">
                ← File
              </button>
            </div>
          )}
          {customerPanel}
        </div>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 start-1/2 z-50 flex w-[min(24rem,90vw)] -translate-x-1/2 flex-col gap-2 rtl:translate-x-1/2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-[10px] border border-os-line bg-os-ink px-4 py-2.5 text-[12px] text-os-onink shadow-os-lift">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
