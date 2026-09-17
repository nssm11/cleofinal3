"use client";
import { useState, useTransition } from "react";
import { cancelOrderAction } from "@/actions/checkout";
import { useToast } from "@/components/ui/toaster";

/**
 * Order-level actions on the account pages.
 *
 * Returns are handled by the single `return_requests` workflow — the order
 * detail page renders the `ReturnForm` backed by
 * `createReturnRequestAction` — so this component only carries cancellation
 * and the two flows can never diverge.
 */
export function OrderActions({ orderId, status }: { orderId: number; status: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const { toast } = useToast();
  const canCancel = status === "pending" || status === "confirmed";
  if (!canCancel) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-error/25 bg-error-soft/40 px-5 py-4">
      <p className="text-[13px] text-slate">
        {confirm ? "Annuler cette commande ? Elle sera remboursée si elle a été réglée." : "Vous pouvez encore changer d’avis — la commande est entre vos mains."}
      </p>
      {confirm ? (
        <div className="flex items-center gap-3">
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await cancelOrderAction(orderId);
                toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "" : r.error });
                setConfirm(false);
              })
            }
            className="btn-secondary min-h-11 px-4 text-[11px]"
          >
            Oui, annuler
          </button>
          <button onClick={() => setConfirm(false)} className="min-h-11 text-[12px] font-bold uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink">
            Non
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="btn-ghost text-error">
          Annuler la commande
        </button>
      )}
    </div>
  );
}
