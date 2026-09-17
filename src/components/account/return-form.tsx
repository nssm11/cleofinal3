"use client";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/primitives";
import { createReturnRequestAction } from "@/actions/shop";
import type { ActionResult } from "@/lib/api";
import { DsAlert } from "@/components/feedback/feedback";

const REASONS = [
  "Produit ne me convient pas",
  "Produit endommagé",
  "Produit reçu par erreur",
  "Effets indésirables",
  "Changement d'avis",
  "Autre",
];

export function ReturnForm({ orderId, items, daysLeft }: { orderId: number; items: { id: number; name: string; quantity: number }[]; daysLeft?: number }) {
  const [state, action, pending] = useActionState<ActionResult<{ id: number; number: string }>, FormData>(createReturnRequestAction as any, null as any);
  const [selected, setSelected] = useState<number | null>(items[0]?.id ?? null);

  if (state?.ok) {
    return (
      <div>
        <p className="font-ant uppercase text-lg text-carbon">Demande envoyée</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-iodine-deep">Référence : {state.data?.number}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <p className="kicker-xs text-iodine-deep">Demander un retour</p>
      <p className="text-[12.5px] leading-relaxed text-muted">
        Sous 7 jours après réception, produit non ouvert — remboursement ou avoir sous 5 jours après retour
        {typeof daysLeft === "number" ? (
          <span className="text-iodine-deep">
            {" · "}{daysLeft > 1 ? `il vous reste ${daysLeft} jours` : daysLeft === 1 ? "dernier jour" : "délai dépassé"}.
          </span>
        ) : null}
        .
      </p>
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Article à retourner">
        <select name="orderItemId" required value={selected ?? ""} onChange={(e) => setSelected(Number(e.target.value))} className="field-box">
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name} (×{i.quantity})</option>
          ))}
        </select>
      </Field>
      <Field label="Motif">
        <select name="reason" required className="field-box">
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Détails (facultatif)">
        <textarea name="message" rows={3} className="field-box" placeholder="Décrivez le problème…" />
      </Field>
      {state && !state.ok && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-outline">
        {pending ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
