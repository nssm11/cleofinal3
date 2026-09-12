"use client";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { StarPicker } from "@/components/ui/stars";
import { Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { CheckIcon } from "@/components/icons";
import { submitReviewAction } from "@/actions/shop";

/**
 * A review is an invited witness, not an open microphone (P02): only the
 * account that actually received this product may write here — the action
 * re-verifies the delivered order and signs the review with the account's
 * name. Moderation still reads everything before publication.
 */
export function ReviewForm({ productId }: { productId: number }) {
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState(submitReviewAction, null);
  const { toast } = useToast();
  useEffect(() => {
    if (state?.ok) toast({ kind: "success", title: state.message ?? "Merci" });
  }, [state, toast]);

  if (state?.ok) {
    return (
      <div className="flex items-start gap-4 border border-success/25 bg-success-soft/50 px-5 py-5">
        <CheckIcon size={18} className="mt-0.5 shrink-0 text-success" />
        <div>
          <p className="text-[14px] text-ink">{state.message}</p>
          <p className="mt-1 text-[12.5px] text-muted">
            Elle apparaîtra sur cette fiche après relecture par notre équipe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="relative overflow-hidden border border-stone-2/40 bg-cream/70 p-6 sm:p-7">
      <span aria-hidden className="marble-veil opacity-25" />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="relative">
        <p className="eyebrow mb-5 text-champagne-2">Partager votre expérience</p>
        <StarPicker value={rating} onChange={setRating} />

        <div className="mt-6">
          <Field label="Titre (facultatif)">
            <input name="title" className="field" placeholder="En quelques mots" />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Votre expérience" error={state && !state.ok ? state.fieldErrors?.body : undefined}>
            <textarea
              name="body"
              rows={4}
              required
              minLength={10}
              className="field"
              placeholder="Texture, résultat, ce que vous avez remarqué…"
            />
          </Field>
        </div>

        {state && !state.ok && (
          <p className="mt-4 text-[12.5px] text-error" role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button disabled={pending} className="btn-secondary">
            {pending ? "Envoi…" : "Publier mon avis"}
          </button>
          <p className="text-[12px] text-muted-2">Signé de votre compte, relu avant publication.</p>
        </div>
      </div>
    </form>
  );
}
