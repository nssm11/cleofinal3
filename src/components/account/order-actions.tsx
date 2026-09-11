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
    <div className="border border-stone bg-cream p-5">
      {confirm ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-charcoal">Annuler cette commande ?</span>
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
          <button onClick={() => setConfirm(false)} className="min-h-11 text-muted">
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
