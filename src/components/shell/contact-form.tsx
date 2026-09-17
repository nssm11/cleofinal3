"use client";
import { useActionState } from "react";
import { Field } from "@/components/ui/primitives";
import { createTicketAction } from "@/actions/shop";

const TYPES = [
  { value: "product_question", label: "Question produit" },
  { value: "pharmacist_advice", label: "Conseil pharmacien" },
  { value: "order", label: "Commande" },
  { value: "delivery", label: "Livraison" },
  { value: "damaged_product", label: "Produit endommagé" },
  { value: "return_request", label: "Retour / échange" },
  { value: "complaint", label: "Réclamation" },
  { value: "other", label: "Autre" },
] as const;

export function ContactForm({ initial }: { initial?: { type?: string; subject?: string; message?: string } }) {
  const [state, action, pending] = useActionState(createTicketAction, null);
  const preType = TYPES.some((t) => t.value === initial?.type) ? initial!.type! : "other";
  if (state?.ok) return <div className="border border-ink bg-ink text-paper p-6"><p className="font-sans text-[18px] font-semibold">Message envoyé</p><p className="mt-2 font-mono text-[12px]">{state.message}</p></div>;
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      <Field label="Type de demande"><select name="type" className="field-swiss" defaultValue={preType}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nom" error={err("name")}><input name="name" required className="field-swiss" /></Field>
        <Field label="E-mail" error={err("email")}><input name="email" type="email" required className="field-swiss" /></Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Sujet" error={err("subject")}><input name="subject" required defaultValue={initial?.subject ?? ""} className="field-swiss" /></Field>
        <Field label="N° commande"><input name="orderNumber" placeholder="CL-…" className="field-swiss" /></Field>
      </div>
      <Field label="Message" error={err("message")}><textarea name="message" rows={5} required defaultValue={initial?.message ?? ""} className="field-swiss" /></Field>
      {state && !state.ok && <p className="font-mono text-[11px] text-error">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Envoi…" : "Envoyer"}</button>
    </form>
  );
}
