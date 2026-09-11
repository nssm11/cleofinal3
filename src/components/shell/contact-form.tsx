"use client";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
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

/**
 * Un seul formulaire, deux entrées : on y vient depuis « Aide », ou depuis le
 * suivi d'une commande avec « J'ai un problème ». Dans le second cas le type,
 * le sujet et le numéro arrivent déjà remplis — la cliente n'a pas à retrouver
 * une référence qu'on vient de lui afficher.
 */
function ContactFormBody() {
  const params = useSearchParams();
  const defaultType = params.get("demande") ?? undefined;
  const defaultSubject = params.get("sujet") ?? undefined;
  const defaultOrderNumber = params.get("commande") ?? undefined;
  const [state, action, pending] = useActionState(createTicketAction, null);
  if (state?.ok) return (
    <div className="border border-stone bg-cream p-6">
      <p className="font-display text-display-sm text-ink">Message envoyé</p>
      <p className="mt-2 text-sm text-muted">{state.message}</p>
    </div>
  );
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-4 border border-stone bg-cream p-6">
      <p className="eyebrow">Nous écrire</p>
      <Field label="Type de demande">
        <select name="type" className="field" defaultValue={TYPES.some((t) => t.value === defaultType) ? defaultType : "other"}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={err("name")}><input name="name" required className="field" /></Field>
        <Field label="E-mail" error={err("email")}><input name="email" type="email" required className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sujet" error={err("subject")}><input name="subject" required defaultValue={defaultSubject} className="field" /></Field>
        <Field label="N° de commande (facultatif)"><input name="orderNumber" placeholder="CL-…" defaultValue={defaultOrderNumber} className="field" /></Field>
      </div>
      <Field label="Message" error={err("message")}>
        <textarea name="message" rows={5} required className="field" />
      </Field>
      {state && !state.ok && <p className="text-xs text-error" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Envoi…" : "Envoyer"}</button>
    </form>
  );
}

/**
 * Enveloppe de suspense : la page « Aide » reste prérendue, seul le formulaire
 * attend les paramètres d'URL. Sans elle, Next ferait basculer la page entière
 * en rendu dynamique pour trois champs pré-remplis.
 */
export function ContactForm() {
  return (
    <Suspense fallback={<div className="h-[420px] animate-pulse border border-stone bg-cream" aria-hidden />}>
      <ContactFormBody />
    </Suspense>
  );
}
