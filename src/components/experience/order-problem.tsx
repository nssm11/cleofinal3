"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChatIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import {D} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { useToast } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { createOrderIssueTicketAction } from "@/actions/experience";

/**
 * « J'ai un problème » — one button that opens a support ticket already
 * carrying the order number, so the customer retypes nothing and the
 * back-office lands with full context.
 */
export function OrderProblemButton({ orderNumber, email, isAuthed }: { orderNumber: string; email?: string; isAuthed: boolean }) {
  const copy = useCopy();
  const t = copy.tracking;
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    if (text.trim().length < 10) return;
    setPending(true);
    const r = await createOrderIssueTicketAction({ orderNumber, email, message: text, locale: "fr" });
    setPending(false);
    if (r.ok) {
      setDone(r.data.number);
      toast({ kind: "success", title: t.problemDone.replace("{number}", r.data.number) });
      setOpen(false);
      if (isAuthed) router.push("/compte/support");
    } else {
      toast({ kind: "error", title: r.error === "short" ? copy.errors.shortMessage : r.error ?? copy.common.errorGeneric });
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-2 border border-crit/40 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-crit transition-colors hover:bg-crit hover:text-canvas">
        <ChatIcon size={13} /> {t.problem}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-carbon/45 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t.problem}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: D.base, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg border border-line-strong/50 bg-mist p-6 shadow-lift lg:p-8"
            >
              <p className="kicker mb-3">{orderNumber}</p>
              <h3 className="font-ant uppercase text-[clamp(1.3rem,2.4vw,1.7rem)] leading-tight text-carbon">{t.problem}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{copy.chat.openHours}</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={copy.chat.placeholder}
                className="field-box mt-4 text-[14px]"
                autoFocus
              />
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <button onClick={() => setOpen(false)} className="btn-ghost min-h-10">{copy.common.cancel}</button>
                <button onClick={submit} disabled={pending || text.trim().length < 10} className="btn-solid !min-h-11 px-6">
                  {pending ? "…" : copy.chat.send}
                </button>
              </div>
              {done && (
                <p className="mt-3 text-[12px] text-ok" role="status">
                  {t.problemDone.replace("{number}", done)}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
