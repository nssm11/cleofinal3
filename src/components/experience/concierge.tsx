"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChatIcon, CloseIcon, SendIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import {D} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { getConciergeRepliesAction, sendConciergeMessageAction } from "@/actions/experience";

/**
 * LA CONCIERGERIE — a soft floating button, a real counter behind it.
 *
 * During opening hours messages land in the support queue and the pharmacist
 * answers there (mirrored here). Outside hours, « le veilleur de nuit » answers
 * the frequent questions and files everything else as a ticket, so nothing is
 * ever lost to the night. One thread, one ticket number, both languages.
 */

type Msg = { id?: number; from: "me" | "them"; text: string; isBot?: boolean; time: string };

function nowLabel() {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export function Concierge() {
  const copy = useCopy();
  const t = copy.chat;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [ticket, setTicket] = useState<{ id: number; number: string } | null>(null);
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const cursor = useRef(0);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: 9_999_999, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, open, reduce]);

  const pollReplies = useCallback(async () => {
    if (!ticket) return;
    const r = await getConciergeRepliesAction(ticket.id, cursor.current);
    if (r.ok && r.data.length) {
      for (const m of r.data) {
        cursor.current = Math.max(cursor.current, m.id);
        setMsgs((x) => [...x, { id: m.id, from: "them", text: m.body, isBot: m.isBot, time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(m.at)) }]);
      }
    }
  }, [ticket]);

  useEffect(() => {
    if (!open || !ticket) return;
    const id = setInterval(() => void pollReplies(), 20_000);
    return () => clearInterval(id);
  }, [open, ticket, pollReplies]);

  const send = (initial?: string) => {
    const body = (initial ?? text).trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    setMsgs((m) => [...m, { from: "me", text: body, time: nowLabel() }]);
    void (async () => {
      const r = await sendConciergeMessageAction({ text: body, ticketId: ticket?.id ?? null });
      if (r.ok) {
        setTicket({ id: r.data.ticketId, number: r.data.ticketNumber });
        setOpenNow(r.data.open);
        if (r.data.botReply) {
          setMsgs((m) => [...m, { from: "them", text: r.data.botReply!, isBot: true, time: nowLabel() }]);
        }
        void pollReplies();
      }
      setSending(false);
    })();
  };

  return (
    <>
      {/* ── The floating button ───────────────────────────────────────── */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.button}
        aria-expanded={open}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: D.base, ease: EASE, delay: 1.2 }}
        className="fixed bottom-[calc(var(--spacing-tabbar)+0.75rem)] z-40 flex min-h-11 items-center gap-2.5 border border-iodine/50 bg-mist/95 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-carbon shadow-lift backdrop-blur-xl transition-colors duration-500 hover:bg-petrol hover:text-canvas ltr:right-4 rtl:left-4 lg:bottom-6 lg:ltr:right-6 lg:rtl:left-6"
      >
        <span className="relative">
          <ChatIcon size={15} />
          <span aria-hidden className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ${openNow === false ? "bg-faint" : "bg-ok"}`} style={{ animation: "halo-pulse 3.2s ease-in-out infinite" }} />
        </span>
        <span className="hidden sm:inline">{open ? copy.common.close : t.button}</span>
      </motion.button>

      {/* ── The conversation ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.title}
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: D.base, ease: EASE }}
            className="fixed bottom-[calc(var(--spacing-tabbar)+4.5rem)] z-40 flex h-[min(70dvh,36rem)] w-[calc(100vw-2rem)] max-w-[26rem] flex-col overflow-hidden border border-line-strong/50 bg-mist shadow-lift ltr:right-4 rtl:left-4 lg:bottom-24 lg:ltr:right-6 lg:rtl:left-6"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line-strong/40 bg-petrol px-5 py-4 text-canvas">
              <div className="min-w-0">
                <p className="font-ant uppercase text-[17px] leading-tight">{t.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[10px] uppercase tracking-[0.16em] text-canvas/50">
                  {openNow === null ? (
                    <>
                      {t.openHours}
                    </>
                  ) : openNow ? (
                    t.openHours
                  ) : (
                    t.closedNow
                  )}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label={copy.common.close} className="flex h-9 w-9 shrink-0 items-center justify-center text-canvas/60 transition-colors hover:text-canvas">
                <CloseIcon size={15} />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4" aria-live="polite">
              {msgs.length === 0 && (
                <div className="pt-2 text-center">
                  <p className="text-[12.5px] leading-relaxed text-muted">{openNow === false ? t.botHours : t.closedNow}</p>
                  <p className="kicker-xs mt-7 text-faint">{t.quick}</p>
                  <ul className="mt-3 space-y-2">
                    {t.faqs.map((f) => (
                      <li key={f}>
                        <button onClick={() => send(f)} className="w-full border border-line-strong/50 bg-canvas/70 px-3.5 py-2.5 text-start text-[12.5px] text-carbon transition-colors hover:border-iodine hover:bg-mist hover:text-carbon">
                          {f}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-[11px] text-faint">{t.callNow}</p>
                </div>
              )}
              {msgs.map((m, i) => (
                <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D.fast, ease: EASE }} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] border px-3.5 py-2.5 text-[13px] leading-relaxed ${ m.from === "me" ? "border-carbon bg-carbon text-canvas" : m.isBot ? "border-iodine/45 bg-iodine-wash/60 text-carbon" : "border-line-strong/60 bg-canvas text-carbon" }`}
                  >
                    {m.from !== "me" && (
                      <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-faint">
                        {m.isBot ? t.botName : t.staffName}
                      </p>
                    )}
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  <span className="mt-1 text-[9.5px] text-faint">{m.time}</span>
                </motion.div>
              ))}
            </div>

            <footer className="border-t border-line-strong/40 bg-canvas/80 px-4 py-3">
              {ticket && (
                <p className="mb-2 text-[10.5px] text-faint">
                  {t.createdTicket.replace("{number}", ticket.number)} ·{" "}
                  <Link href="/compte/support" className="text-carbon underline underline-offset-2">
                    {copy.account.nav.support[1]}
                  </Link>
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="concierge-input" className="sr-only">{t.placeholder}</label>
                <input
                  id="concierge-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.placeholder}
                  maxLength={2000}
                  className="field-box !min-h-11 text-[13px]"
                />
                <button type="submit" disabled={sending || !text.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center bg-carbon text-canvas transition-colors hover:bg-iodine-deep disabled:opacity-40" aria-label={t.send}>
                  <SendIcon size={15} className="rtl-mirror" />
                </button>
              </form>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
