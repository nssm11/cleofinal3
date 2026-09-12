"use client";
import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, ExternalIcon, GiftIcon, LockIcon } from "@/components/icons";
import { wishlistShareAction, type WishlistShareResult } from "@/actions/shop";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * PARTAGER SA SÉLECTION.
 *
 * Trois états, annoncés sans détour : pas de lien, lien actif, lien suspendu.
 * La distinction « suspendu » / « révoqué » n'est pas un détail de réglage —
 * suspendre garde l'adresse pour la rouvrir, révoquer la fait disparaître, et
 * la personne doit savoir lequel des deux elle vient de faire.
 *
 * Ce que le lien expose est écrit ici, en clair : les favoris, et rien d'autre.
 * Un partage dont on ne sait pas l'étendue ne se partage pas.
 */
export function WishlistSharePanel({ href, isPublic, title }: { href?: string; isPublic: boolean; title: string }) {
  const [state, action, pending] = useActionState<WishlistShareResult | null, FormData>(wishlistShareAction, null);
  const [draft, setDraft] = useState(title);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const live = state?.href ?? href;
  const publicNow = state?.isPublic ?? isPublic;

  async function copy() {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(live);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Le presse-papiers peut être refusé (contexte non sécurisé, permissions).
      // Le lien reste lisible et sélectionnable : ce n'est pas un échec bloquant.
    }
  }

  return (
    <section className="border border-stone bg-cream/40 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-2 text-champagne-2">
            <GiftIcon size={13} /> Partager cette sélection
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-charcoal">
            Un lien qui ne montre que vos favoris — ni vos coordonnées, ni vos commandes, ni
            vos adresses. Utile pour une liste d&apos;anniversaire ou un conseil demandé à distance.
          </p>
        </div>

        <form action={action} className="flex shrink-0 items-center gap-2">
          <input type="hidden" name="intent" value={publicNow ? "disable" : "enable"} />
          <input type="hidden" name="title" value={draft} />
          <button disabled={pending} className="btn-secondary whitespace-nowrap">
            {pending ? "…" : publicNow ? "Suspendre le lien" : live ? "Réactiver le lien" : "Créer le lien"}
          </button>
        </form>
      </div>

      <AnimatePresence initial={false}>
        {live && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-stone pt-4">
              <label htmlFor="wishlist-title" className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-2">
                Titre de la liste
              </label>
              <div className="flex gap-2">
                <input
                  id="wishlist-title"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                  maxLength={120}
                  className="field flex-1"
                />
                <form action={action}>
                  <input type="hidden" name="intent" value={publicNow ? "disable" : "enable"} />
                  <input type="hidden" name="title" value={draft} />
                  {/* Enregistrer le titre repasse par la même action : un seul
                      chemin d'écriture, donc un seul endroit à vérifier. */}
                  <button disabled={pending} className="btn-ghost whitespace-nowrap" aria-label="Enregistrer le titre">
                    Enregistrer
                  </button>
                </form>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate border border-stone-2/60 bg-paper px-3 py-2 font-mono text-[12px] text-muted">
                  {live}
                </code>
                <button onClick={copy} className="btn-ghost whitespace-nowrap">
                  {copied ? <CheckIcon size={14} /> : null} {copied ? "Copié" : "Copier"}
                </button>
                <a href={live} className="btn-ghost whitespace-nowrap">
                  <ExternalIcon size={14} /> Voir
                </a>
                <form action={action}>
                  <input type="hidden" name="intent" value="revoke" />
                  <button disabled={pending} className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[12px] text-muted transition-colors hover:text-error">
                    <LockIcon size={13} /> Révoquer
                  </button>
                </form>
              </div>

              <p className={`mt-3 flex items-center gap-2 text-[12px] ${publicNow ? "text-success" : "text-warning"}`} role="status">
                {publicNow ? <CheckIcon size={13} /> : <LockIcon size={13} />}
                {(state?.ok ? state.message : undefined) ??
                  (publicNow
                    ? "Lien actif : toute personne qui l'a peut voir la sélection."
                    : "Lien suspendu : il ne répond plus, mais l'adresse est conservée.")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
