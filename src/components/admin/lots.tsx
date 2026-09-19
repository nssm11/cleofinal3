"use client";
import { useActionState, useEffect } from "react";
import { dateLotAction, lotStatusAction, receiveLotAction, sweepExpiredAction } from "@/actions/lots";
import { useToast } from "@/components/ui/toaster";
import { AField, abtn, afield } from "./ui";

type P = { id: number; name: string; stock: number };
type St = { id: number; name: string };

/** Réception d'un lot : le seul moment où une date entre dans la maison. */
export function ReceiveLotForm({ products, stores }: { products: P[]; stores: St[] }) {
  const [state, action, pending] = useActionState(receiveLotAction, null);
  const { toast } = useToast();
  useEffect(() => { if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); }, [state, toast]);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AField label="Produit">
        <select name="productId" required className={afield}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </AField>
      <AField label="Comptoir de destination">
        <select name="storeId" required className={afield}>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </AField>
      <AField label="N° de lot">
        <input name="lot" required placeholder="A4417" className={afield} />
      </AField>
      <AField label="Péremption (laisser vide si inconnue)">
        <input name="expiresAt" type="date" className={afield} />
      </AField>
      <AField label="Quantité">
        <input name="quantity" type="number" min={1} required placeholder="12" className={afield} />
      </AField>
      <AField label="Placement">
        <select name="placed" className={afield}>
          <option value="shelf">Rayon</option>
          <option value="back">Réserve</option>
        </select>
      </AField>
      <AField label="Fournisseur">
        <input name="supplier" placeholder="Grossiste officinal Tunis" className={afield} />
      </AField>
      <AField label="Note">
        <input name="note" placeholder="Carton abîmé, BL n° 4412…" className={afield} />
      </AField>
      <div className="flex items-end">
        <button disabled={pending} className={`${abtn} w-full`}>Réceptionner</button>
      </div>
      <p className="text-[11px] leading-relaxed text-ops-muted sm:col-span-2 lg:col-span-3">
        Une réception sans date est acceptée : le lot existe alors comme « DLC non communiquée » et reste invendable jusqu&apos;à ce que quelqu&apos;un la saisisse. Un lot reçu déjà périmé part directement en quarantaine.
      </p>
    </form>
  );
}

/** Dater un lot reçu sans date — ce qui le rend vendable. */
export function DateLotForm({ lotId, label }: { lotId: number; label: string }) {
  const [state, action, pending] = useActionState(dateLotAction, null);
  const { toast } = useToast();
  useEffect(() => { if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); }, [state, toast]);
  return (
    <form action={action} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="lotId" value={lotId} />
      <label className="sr-only" htmlFor={`d-${lotId}`}>Péremption du lot {label}</label>
      <input id={`d-${lotId}`} name="expiresAt" type="date" required className="h-8 border border-ops-line bg-ops-canvas px-2 text-[11px]" />
      <button disabled={pending} className="h-8 border border-ops-line px-2 text-[10px] uppercase tracking-[0.12em] hover:bg-ops-soft">Dater</button>
    </form>
  );
}

/** Retirer un lot : quarantaine, destruction, ou remise en vente. */
export function LotStatusForm({ lotId, status, label }: { lotId: number; status: string; label: string }) {
  const [state, action, pending] = useActionState(lotStatusAction, null);
  const { toast } = useToast();
  useEffect(() => { if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); }, [state, toast]);
  const options = status === "sale"
    ? [{ v: "quarantine", l: "Quarantaine" }, { v: "destroyed", l: "Détruire" }, { v: "returned", l: "Retour fournisseur" }]
    : [{ v: "sale", l: "Remettre en vente" }, { v: "destroyed", l: "Détruire" }];
  return (
    <form action={action} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="lotId" value={lotId} />
      <label className="sr-only" htmlFor={`s-${lotId}`}>Nouveau statut du lot {label}</label>
      <select id={`s-${lotId}`} name="status" className="h-8 border border-ops-line bg-ops-canvas px-2 text-[11px]">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <label className="sr-only" htmlFor={`n-${lotId}`}>Motif</label>
      <input id={`n-${lotId}`} name="note" placeholder="Motif" className="h-8 w-32 border border-ops-line bg-ops-canvas px-2 text-[11px]" />
      <button disabled={pending} className="h-8 border border-ops-line px-2 text-[10px] uppercase tracking-[0.12em] hover:bg-ops-soft">Appliquer</button>
    </form>
  );
}

/** Le balayage à la demande : ce que la nuit fait, un humain peut le faire là. */
export function SweepExpiredForm() {
  const [state, action, pending] = useActionState(sweepExpiredAction, null);
  const { toast } = useToast();
  useEffect(() => { if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); }, [state, toast]);
  return (
    <form action={action}>
      <button disabled={pending} className={abtn}>Retirer les lots périmés</button>
    </form>
  );
}
