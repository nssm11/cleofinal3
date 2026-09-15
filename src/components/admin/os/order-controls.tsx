"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { osMicro, osStandard } from "@/lib/admin/motion";
import { ALLOWED_TRANSITIONS, ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { markOutForDeliveryAction, resendOutboxEmailAction, saveOrderNotesAction, setPaymentStatusAction, updateOrderStatusAction } from "@/actions/admin";
import { orderEventsSince } from "@/actions/admin-os";
import { useToast } from "@/components/ui/toaster";
import { Glyph } from "./icons";
import { OsButton } from "./primitives";
import { AnimatedNumber } from "./motion";

/* ══════════════════════════════════════════════════════════════════════════
   COMMANDES — les mains sur la commande
   ──────────────────────────────────────────────────────────────────────────
   Every control here writes to the same ledgers the shop writes to: an order
   event, a payment status, an internal note. Confirmation is asked once, in an
   instrument that looks like the rest of the tool, never in a browser dialog.
   ══════════════════════════════════════════════════════════════════════════ */

const RISK: OrderStatus[] = ["cancelled", "returned"];

export function OrderWorkflow({ orderId, status, nextStates }: { orderId: number; status: OrderStatus; nextStates?: OrderStatus[] }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const reduce = useReducedMotion();
  const nexts: OrderStatus[] = nextStates ?? ALLOWED_TRANSITIONS[status] ?? [];

  const run = (next: OrderStatus) => {
    start(async () => {
      const r = await updateOrderStatusAction(orderId, next, message || undefined);
      toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "Statut mis à jour" : r.error });
      if (r.ok) { setMessage(""); router.refresh(); }
    });
  };

  if (!nexts.length) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-os-muted">
        <Glyph name="lock" size={14} />
        Commande close : {ORDER_STATUS_LABELS[status]}. Aucune transition n&apos;est autorisée depuis cet état.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="os-label text-os-muted">Message pour la chronologie</span>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex. Colis remis au transporteur à 14 h 20"
          className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2.5 text-[13px] text-os-text placeholder:text-os-faint focus:border-os-line-strong focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {nexts.map((n) => (
          <button
            key={n}
            disabled={pending}
            onClick={() => (RISK.includes(n) ? setConfirming(n) : run(n))}
            className={cn(
              "inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors disabled:opacity-50",
              RISK.includes(n)
                ? "border-os-crit/40 text-os-crit hover:bg-os-crit-soft"
                : "border-os-ink bg-os-ink text-os-onink hover:opacity-90",
            )}
          >
            {n === "shipped" && <Glyph name="route" size={13} />}
            {n === "delivered" && <Glyph name="check" size={13} />}
            {ORDER_STATUS_LABELS[n]}
          </button>
        ))}
        {status === "shipped" && (
          <button
            disabled={pending}
            onClick={() => start(async () => {
              const r = await markOutForDeliveryAction(orderId);
              toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "Cliente prévenue" : r.error });
              if (r.ok) router.refresh();
            })}
            className="inline-flex items-center gap-1.5 border border-os-gold/50 bg-os-gold-soft px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-os-gold-2 transition-colors hover:bg-os-gold/20 disabled:opacity-50"
          >
            <Glyph name="mail" size={13} /> Prévenir — en cours de livraison
          </button>
        )}
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={osMicro}
            className="overflow-hidden"
          >
            <div className="border border-os-crit/40 bg-os-crit-soft/50 p-3">
              <p className="text-[12.5px] text-os-text">
                Confirmer <strong>{ORDER_STATUS_LABELS[confirming]}</strong> ? Le stock des articles sera réintégré au registre et un événement sera écrit dans la chronologie.
              </p>
              <div className="mt-2 flex gap-2">
                <OsButton size="sm" variant="danger" disabled={pending} onClick={() => { const n = confirming; setConfirming(null); run(n); }}>
                  Oui, {ORDER_STATUS_LABELS[confirming].toLowerCase()}
                </OsButton>
                <OsButton size="sm" variant="quiet" onClick={() => setConfirming(null)}>Annuler</OsButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PaymentControlOs({ orderId, method, status, total }: { orderId: number; method: string; status: string; total: number }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const options: { key: "pending" | "paid" | "refunded"; label: string }[] = [
    { key: "pending", label: "En attente" },
    { key: "paid", label: "Encaissé" },
    { key: "refunded", label: "Remboursé" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-os-muted">
        {PAYMENT_LABELS[method as keyof typeof PAYMENT_LABELS] ?? method} · <span className="os-num text-os-text">{new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(total / 1000)} DT</span>
      </p>
      <div className="inline-flex border border-os-line">
        {options.map((o) => {
          const active = status === o.key;
          return (
            <button
              key={o.key}
              disabled={pending || active}
              onClick={() => start(async () => {
                const r = await setPaymentStatusAction(orderId, o.key);
                toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "Paiement mis à jour" : r.error });
                if (r.ok) router.refresh();
              })}
              className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                active ? "bg-os-ink text-os-onink" : "text-os-muted hover:bg-os-surface-2 hover:text-os-text",
                o.key === "refunded" && !active && "text-os-crit/80")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {method === "cod" && <p className="text-[11px] text-os-faint">Paiement à la livraison : le statut se règle aussi automatiquement lors de la livraison.</p>}
    </div>
  );
}

export function OrderNotesOs({ orderId, internalNote, trackingCode }: { orderId: number; internalNote: string | null; trackingCode: string | null }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const [note, setNote] = useState(internalNote ?? "");
  const [tracking, setTracking] = useState(trackingCode ?? "");
  const [saved, setSaved] = useState(false);
  const dirty = note !== (internalNote ?? "") || tracking !== (trackingCode ?? "");

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="os-label text-os-muted">Note interne — jamais montrée à la cliente</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-os-line bg-os-surface px-2.5 py-2 text-[13px] text-os-text placeholder:text-os-faint focus:border-os-line-strong focus:outline-none"
          placeholder="Ex. Cliente préfère être appelée avant 10 h"
        />
      </label>
      <label className="block">
        <span className="os-label text-os-muted">Numéro de suivi</span>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2.5 font-mono text-[13px] text-os-text focus:border-os-line-strong focus:outline-none"
          placeholder="TN-000-000"
        />
      </label>
      <div className="flex items-center gap-2">
        <OsButton
          size="sm"
          variant="primary"
          disabled={pending || !dirty}
          onClick={() => start(async () => {
            const r = await saveOrderNotesAction(orderId, note, tracking);
            toast({ kind: r.ok ? "success" : "error", title: r.ok ? "Notes enregistrées" : r.error });
            if (r.ok) setSaved(true);
          })}
        >
          Enregistrer
        </OsButton>
        {dirty && <span className="text-[11px] text-os-warn">Modifications non enregistrées</span>}
        <AnimatePresence>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] text-os-ok">
              <Glyph name="check" size={12} /> Enregistré
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Live additions to the order's chronology, without reloading the workspace. */
export function OrderEventsLive({ orderId, initialCount }: { orderId: number; initialCount: number }) {
  const [fresh, setFresh] = useState<{ id: number; status: string; message: string | null; at: string }[]>([]);
  const reduce = useReducedMotion();
  const count = useRef(initialCount);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const rows = await orderEventsSince(orderId);
        if (stop) return;
        if (rows.length > count.current) {
          setFresh(rows.slice(count.current).reverse());
          count.current = rows.length;
        }
      } catch { /* the page still works without the whisper */ }
    };
    const id = setInterval(tick, 20_000);
    return () => { stop = true; clearInterval(id); };
  }, [orderId]);

  return (
    <AnimatePresence>
      {fresh.map((e) => (
        <motion.li
          key={e.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={osStandard}
          className="border-l-2 border-os-gold bg-os-gold-soft/40 px-3 py-2"
        >
          <p className="text-[12.5px] text-os-text">{ORDER_STATUS_LABELS[e.status as OrderStatus] ?? e.status}{e.message ? ` — ${e.message}` : ""}</p>
          <p className="os-num text-[11px] text-os-muted">
            {new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(e.at))} · à l&apos;instant
          </p>
        </motion.li>
      ))}
    </AnimatePresence>
  );
}

export function OrderAge({ createdAt }: { createdAt: string }) {
  const hours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  return (
    <span className="os-num flex items-baseline gap-1 text-[12px] text-os-muted">
      <AnimatedNumber value={hours} spec={{ kind: "decimal" }} />
      <span className="text-os-faint">h d&apos;âge</span>
    </span>
  );
}

/** A letter that already left — or never did — can be sent again, once asked. */
export function ResendLetter({ id, kind, status, subject, to, at, error }: { id: number; kind: string; status: string; subject: string; to: string; at: string | null; error: string | null }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-os-line-soft py-2 last:border-0">
      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
        status === "sent" ? "bg-os-ok-soft text-os-ok" : status === "failed" ? "bg-os-crit-soft text-os-crit" : "bg-os-warn-soft text-os-warn")}>
        {status === "sent" ? "envoyée" : status === "failed" ? "échec" : "en attente"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] text-os-text">{subject}</span>
        <span className="block truncate text-[11px] text-os-faint">
          {kind} · {to} · {at ? new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at)) : "jamais partie"}
        </span>
        {error && <span className="block truncate text-[11px] text-os-crit">{error}</span>}
      </span>
      <OsButton
        size="sm"
        variant={status === "failed" ? "danger" : "quiet"}
        disabled={pending}
        onClick={() => start(async () => {
          const r = await resendOutboxEmailAction(id);
          toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "Lettre renvoyée" : r.error });
          if (r.ok) router.refresh();
        })}
      >
        {status === "sent" ? "Renvoyer" : "Envoyer maintenant"}
      </OsButton>
    </li>
  );
}
