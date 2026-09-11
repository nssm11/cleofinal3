"use client";
import { useActionState, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BellIcon, CheckIcon } from "@/components/icons";
import { restockAlertAction } from "@/actions/shop";
import { Field } from "@/components/ui/primitives";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * « PRÉVENEZ-MOI » — la file d'attente d'une référence épuisée.
 *
 * Trois règles, toutes visibles :
 *   • une personne connectée ne retape pas son adresse — elle est déjà là ;
 *   • le canal se choisit, et le téléphone n'apparaît que si WhatsApp est
 *     choisi : demander un numéro à quelqu'un qui veut un e-mail est une
 *     friction qu'on ne doit pas imposer ;
 *   • la confirmation nomme l'adresse qui sera prévenue, pour qu'une faute de
 *     frappe se voie tout de suite plutôt qu'au réassort.
 */
export function RestockForm({
  productId,
  productName,
  userEmail,
}: {
  productId: number;
  productName: string;
  userEmail?: string | null;
}) {
  const [state, action, pending] = useActionState(restockAlertAction, null);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const reduce = useReducedMotion();
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);

  if (state?.ok) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: D.base, ease: EASE_LUXE }}
        className="border border-success/35 bg-success-soft px-5 py-4"
        role="status"
      >
        <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-success">
          <CheckIcon size={15} /> Vous serez prévenue
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-charcoal">{state.message}</p>
        <p className="mt-2 text-[11.5px] text-muted-2">
          La file d&apos;attente est servie avant la mise en vente publique.
        </p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="border border-stone-2/45 bg-cream/60 px-5 py-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="channel" value={channel} />

      <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
        <BellIcon size={15} className="text-champagne-2" /> Prévenez-moi au réassort
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-charcoal">
        « {productName} » est momentanément épuisé. Laissez-nous une adresse : nous écrivons dès
        l&apos;arrivée du réassort, sans relance derrière.
      </p>

      <div className="mt-4 flex gap-1 border-b border-stone-2/50" role="group" aria-label="Canal de notification">
        {(["email", "whatsapp"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            aria-pressed={channel === c}
            className={`relative px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              channel === c ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {c === "email" ? "E-mail" : "WhatsApp"}
            <AnimatePresence initial={false}>
              {channel === c && (
                <motion.span
                  layoutId="restock-channel"
                  className="absolute inset-x-0 -bottom-px h-px bg-champagne-2"
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                />
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {channel === "whatsapp" ? (
          <>
            <Field label="Numéro WhatsApp" error={err("phone")}>
              <input name="phone" type="tel" autoComplete="tel" placeholder="22 123 456" className="field" />
            </Field>
            <Field label="E-mail (pour garder une trace)">
              <input name="email" type="email" autoComplete="email" defaultValue={userEmail ?? ""} className="field" />
            </Field>
          </>
        ) : userEmail ? (
          <p className="text-[12.5px] text-muted">
            Nous écrirons à <span className="text-ink">{userEmail}</span>.
            <input type="hidden" name="email" value={userEmail} />
          </p>
        ) : (
          <Field label="Votre e-mail" error={err("email")}>
            <input name="email" type="email" autoComplete="email" required className="field" />
          </Field>
        )}
      </div>

      {state && !state.ok && !state.fieldErrors && (
        <p className="mt-3 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : "Prévenez-moi"}
        </button>
        <a href="tel:+21671450210" className="text-[12px] text-muted underline underline-offset-4 hover:text-ink">
          Ou appelez Ezzahra — 71 450 210
        </a>
      </div>
    </form>
  );
}
