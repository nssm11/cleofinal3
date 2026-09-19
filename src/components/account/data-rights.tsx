"use client";
import { useActionState, useEffect, useState } from "react";
import { deleteAccountAction } from "@/actions/shop";
import { useToast } from "@/components/ui/toaster";

/**
 * VOS DONNÉES — les deux gestes qu'une maison doit à ses clientes.
 *
 * L'export part d'un clic ; la suppression demande de taper son adresse, parce
 * qu'un compte ne se supprime pas par accident. Ce qui reste après est écrit
 * noir sur blanc, avant le bouton : les factures, sans les coordonnées.
 */
export function ExportDataCard({ counts, email }: { counts: { orders: number; items: number; addresses: number; wishlist: number; reviews: number; rituals: number }; email: string }) {
  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-carbon">
        Tout ce que la maison garde sur ce compte, dans un fichier que vous emportez. Rien n&apos;est reformulé : ce sont vos lignes, telles quelles.
      </p>
      <ul className="grid gap-x-8 gap-y-1.5 text-[13px] text-muted sm:grid-cols-2">
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Commandes et articles</span><span className="tabular-nums text-carbon">{counts.orders} · {counts.items} lignes</span></li>
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Adresses</span><span className="tabular-nums text-carbon">{counts.addresses}</span></li>
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Favoris</span><span className="tabular-nums text-carbon">{counts.wishlist}</span></li>
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Rituels</span><span className="tabular-nums text-carbon">{counts.rituals}</span></li>
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Avis publiés</span><span className="tabular-nums text-carbon">{counts.reviews}</span></li>
        <li className="flex justify-between gap-3 border-b border-line/50 pb-1.5"><span>Compte</span><span className="truncate text-carbon">{email}</span></li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-1">
        <a href="/api/compte/export?format=json" download className="inline-flex min-h-11 items-center border border-carbon bg-carbon px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-chalk transition-colors hover:bg-petrol">
          Télécharger tout (JSON)
        </a>
        <a href="/api/compte/export?format=csv" download className="inline-flex min-h-11 items-center border border-line px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-carbon transition-colors hover:border-iodine hover:text-iodine-deep">
          Mes commandes (CSV)
        </a>
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        Le CSV contient vos commandes avec le lot et la date de péremption de chaque article — la partie qu&apos;on ouvre vraiment dans un tableur.
      </p>
    </div>
  );
}

export function DeleteAccountCard({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccountAction, null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); }, [state, toast]);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-carbon">
        La suppression est réelle et immédiate. Voici exactement ce qui part, et ce qui reste.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line/60 bg-mist/40 p-4">
          <p className="kicker-xs mb-2.5 text-iodine-deep">Effacé pour de bon</p>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-muted">
            <li>· Vos favoris et vos listes partagées</li>
            <li>· Vos adresses de livraison</li>
            <li>· Vos rituels et rappels</li>
            <li>· Vos notifications et alertes de réassort</li>
            <li>· Vos abonnements en cours (annulés)</li>
            <li>· Votre mot de passe et vos sessions</li>
            <li>· Vos points de fidélité, non récupérables</li>
          </ul>
        </div>
        <div className="border border-line/60 bg-mist/40 p-4">
          <p className="kicker-xs mb-2.5 text-faint">Conservé, parce que la loi le demande</p>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-muted">
            <li>· Vos factures, dix ans (obligation comptable)</li>
            <li>· détachées du compte : ni nom, ni téléphone, ni adresse complète</li>
            <li>· Aucun e-mail ne vous sera adressé ensuite</li>
          </ul>
        </div>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center border border-line px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:border-iodine hover:text-iodine-deep">
          Supprimer mon compte
        </button>
      ) : (
        <form action={action} className="space-y-3 border-t border-line/60 pt-5">
          <label htmlFor="confirm-email" className="block text-[12.5px] text-carbon">
            Tapez <strong className="font-semibold">{email}</strong> pour confirmer.
          </label>
          <input id="confirm-email" name="email" type="email" required autoComplete="off" placeholder={email} className="h-11 w-full max-w-md border border-line bg-porcelain px-4 text-[13.5px] text-carbon outline-none focus:border-iodine" />
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={pending} className="inline-flex min-h-11 items-center border border-iodine bg-iodine px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-chalk transition-colors hover:bg-iodine-deep disabled:opacity-60">
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center px-2 text-[12px] text-muted underline decoration-dotted">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
