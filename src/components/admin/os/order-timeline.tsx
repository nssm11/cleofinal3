"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { osFast, osStandard } from "@/lib/admin/motion";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";
import { Glyph } from "./icons";

/* ══════════════════════════════════════════════════════════════════════════
   CHRONOLOGIE VERTICALE
   ──────────────────────────────────────────────────────────────────────────
   Two readings of the same order: the five canonical doors the shop knows
   (créée → payée → préparée → expédiée → livrée) and, underneath, the exact
   events the base recorded, with their timestamps and authors. The rail fills
   from the top as the order advances — motion that says "progress", once.
   ══════════════════════════════════════════════════════════════════════════ */

export type StageKey = "created" | "paid" | "preparing" | "shipped" | "delivered";

const STAGES: { key: StageKey; label: string; hint: string; icon: "bag" | "ticket" | "cube" | "route" | "check" }[] = [
  { key: "created", label: "Commande créée", hint: "La cliente a validé son panier", icon: "bag" },
  { key: "paid", label: "Paiement", hint: "Règlement encaissé ou validé", icon: "ticket" },
  { key: "preparing", label: "Préparation", hint: "Les articles sont rassemblés et emballés", icon: "cube" },
  { key: "shipped", label: "Expédition", hint: "Remis au transporteur ou en boutique", icon: "route" },
  { key: "delivered", label: "Livraison", hint: "Reçue par la cliente", icon: "check" },
];

export function OrderTimeline({
  status, events, createdAt, paidAt, shippedAt, deliveredAt,
}: {
  status: string;
  events: { id: number; status: string; message: string | null; at: string; actor: string | null }[];
  createdAt: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}) {
  const reduce = useReducedMotion();
  const reached = useMemo(() => {
    const map: Record<StageKey, string | null> = { created: createdAt, paid: paidAt ?? null, preparing: null, shipped: shippedAt ?? null, delivered: deliveredAt ?? null };
    const seq: string[] = ["pending", "confirmed", "preparing", "shipped", "delivered"];
    const idx = seq.indexOf(status);
    if (idx >= 2 && !map.preparing) map.preparing = events.find((e) => e.status === "preparing")?.at ?? null;
    if (idx >= 2 && !map.paid) map.paid = events.find((e) => e.status === "confirmed")?.at ?? null;
    if (status === "cancelled" || status === "returned") {
      if (!map.preparing) map.preparing = events.find((e) => e.status === "preparing")?.at ?? null;
    }
    return { map, idx, closed: status === "cancelled" || status === "returned" };
  }, [status, events, createdAt, paidAt, shippedAt, deliveredAt]);

  const progress = reached.closed ? 1 : Math.max(0, reached.idx) / 4;

  return (
    <div className="relative">
      <ol className="relative space-y-0">
        <span className="absolute left-[1.05rem] top-3 bottom-3 w-px bg-os-line" aria-hidden />
        <motion.span
          className={cn("absolute left-[1.05rem] top-3 w-px", reached.closed ? "bg-os-crit" : "bg-os-gold")}
          initial={reduce ? undefined : { height: 0 }}
          animate={{ height: `${Math.min(100, progress * 100)}%` }}
          transition={osStandard}
          aria-hidden
        />
        {STAGES.map((s, i) => {
          const at = reached.map[s.key];
          const done = Boolean(at);
          const current = !done && !reached.closed && i === Math.max(0, reached.idx + (reached.map.paid ? 0 : 1));
          return (
            <li key={s.key} className="relative flex gap-4 py-2.5 pl-1">
              <span
                className={cn(
                  "relative z-10 mt-0.5 grid h-[1.4rem] w-[1.4rem] shrink-0 place-items-center rounded-full border",
                  done ? (reached.closed ? "border-os-crit bg-os-crit text-white" : "border-os-ink bg-os-ink text-os-onink")
                    : current ? "border-os-gold bg-os-surface text-os-gold" : "border-os-line bg-os-surface text-os-faint",
                )}
                aria-hidden
              >
                {done ? <Glyph name={reached.closed ? "alert" : "check"} size={11} strokeWidth={2} /> : <Glyph name={s.icon} size={11} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className={cn("text-[13px]", done ? "text-os-text" : "text-os-muted")}>{s.label}</span>
                  {current && <span className="os-label text-os-gold">étape en cours</span>}
                </p>
                <p className="text-[11.5px] text-os-faint">{s.hint}</p>
                {at && (
                  <p className="os-num mt-0.5 text-[11.5px] text-os-muted">
                    {new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at))}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 border-t border-os-line pt-3">
        <p className="os-label text-os-muted">Événements enregistrés ({events.length})</p>
        <ol className="mt-2 space-y-1.5">
          {events.slice().reverse().map((e) => (
            <motion.li
              key={e.id}
              initial={reduce ? undefined : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={osFast}
              className="flex items-start gap-3 border-b border-dashed border-os-line-soft pb-1.5 last:border-0"
            >
              <span className="os-num w-[7.5rem] shrink-0 text-[11px] text-os-faint">
                {new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(e.at))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[12.5px] text-os-text">{ORDER_STATUS_LABELS[e.status as keyof typeof ORDER_STATUS_LABELS] ?? e.status}</span>
                {e.message ? <span className="text-os-muted"> — {e.message}</span> : null}
              </span>
              {e.actor && <span className="shrink-0 text-[11px] text-os-faint">{e.actor}</span>}
            </motion.li>
          ))}
          {events.length === 0 && <li className="text-[12px] text-os-muted">Aucun événement : la commande n&apos;a pas encore bougé depuis sa création.</li>}
        </ol>
      </div>
    </div>
  );
}
