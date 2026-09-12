"use client";
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GiftIcon, CheckIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { GIFT_WRAP_FEE, formatDT } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import type { CartLine } from "@/lib/cart";

/**
 * OFFRIR CE SOIN.
 *
 * Offrir n'est pas « mettre au panier avec un ruban » : c'est écrire un mot.
 * Le panneau demande donc le mot **avant** l'ajout, et l'emballage cadeau est
 * enclenché d'office — personne n'offre un soin arrivé dans un colis de
 * commande ordinaire.
 *
 * Le mot part dans le panier, pas dans un état local : il doit survivre de la
 * fiche jusqu'à la caisse, où il reste modifiable. Trois cents caractères,
 * comme la colonne `gift_message` — la limite est la même des deux côtés, donc
 * ce qui est tapé ici ne sera jamais tronqué plus tard.
 */
export function GiftAction({ line, from }: { line: Omit<CartLine, "quantity">; from?: React.RefObject<HTMLDivElement | null> }) {
  const cart = useCart();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();

  const left = 300 - message.length;

  function give() {
    const note = [to.trim() ? `Pour ${to.trim()}` : "", message.trim()].filter(Boolean).join(" — ").slice(0, 300);
    cart.setGift(true, note);
    cart.add(line, 1, from?.current ?? null);
    setDone(true);
  }

  return (
    <div className="border-t border-stone pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center gap-2.5 text-left text-[12px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
      >
        <GiftIcon size={16} className="text-champagne-2" />
        Offrir ce soin
        <span aria-hidden className="ml-auto text-muted-2">
          +{formatDT(GIFT_WRAP_FEE)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="overflow-hidden"
          >
            <div className="mt-4 border border-stone bg-cream/50 p-4">
              {done ? (
                <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-success" role="status">
                  <CheckIcon size={15} className="mt-0.5 shrink-0" />
                  C&apos;est sur le plateau, emballage cadeau enclenché. Vous pourrez relire le mot à
                  l&apos;étape suivante.
                </p>
              ) : (
                <>
                  <p className="text-[13px] leading-relaxed text-charcoal">
                    Nous joignons votre mot, écrit à la main sur une carte, et nous n&apos;imprimons
                    aucun prix sur le bordereau.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label htmlFor={`${id}-to`} className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-2">
                        Pour qui&nbsp;?
                      </label>
                      <input
                        id={`${id}-to`}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        maxLength={60}
                        placeholder="Prénom de la personne"
                        className="field"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${id}-msg`} className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-2">
                        Votre mot
                      </label>
                      <textarea
                        id={`${id}-msg`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                        rows={3}
                        maxLength={300}
                        placeholder="Quelques lignes, telles que vous les diriez."
                        className="field resize-none"
                      />
                      <p className={`mt-1 text-right text-[11px] ${left < 40 ? "text-warning" : "text-muted-2"}`}>
                        {left} caractère{left > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <button onClick={give} disabled={line.stock <= 0} className="btn-primary mt-2 w-full">
                    {line.stock <= 0 ? "Épuisé" : "Ajouter comme cadeau"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted-2">
                    Le mot reste modifiable jusqu&apos;au paiement.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
