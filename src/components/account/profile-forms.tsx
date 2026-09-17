"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { changePasswordAction, deleteAddressAction, saveAddressAction, updateProfileAction } from "@/actions/auth";
import { Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { GOVERNORATES } from "@/lib/tunisia";
import type { Address } from "@/db/schema";
import type { ActionResult } from "@/lib/api";

function useFeedback(state: ActionResult | null) {
  const { toast } = useToast();
  useEffect(() => {
    if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "Enregistré" : state.error });
  }, [state, toast]);
}

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; phone: string | null; email: string } }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  useFeedback(state);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Prénom" error={err("firstName")}><input name="firstName" defaultValue={user.firstName} className="field-swiss" /></Field>
        <Field label="Nom" error={err("lastName")}><input name="lastName" defaultValue={user.lastName} className="field-swiss" /></Field>
      </div>
      <Field label="E-mail"><input value={user.email} disabled className="field-swiss opacity-60" /></Field>
      <Field label="Téléphone" error={err("phone")}><input name="phone" defaultValue={user.phone ?? ""} className="field-swiss" /></Field>
      <button disabled={pending} className="btn-primary">Enregistrer</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  useFeedback(state);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="max-w-md space-y-6">
      <Field label="Mot de passe actuel" error={err("current")}><input name="current" type="password" required className="field-swiss" /></Field>
      <Field label="Nouveau mot de passe" error={err("next")}><input name="next" type="password" minLength={8} required className="field-swiss" /></Field>
      <button disabled={pending} className="btn-primary">Modifier</button>
    </form>
  );
}

export function AddressForm({ address, onDone }: { address?: Address; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveAddressAction, null);
  useFeedback(state);
  useEffect(() => { if (state?.ok) onDone?.(); }, [state, onDone]);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6 border border-ink bg-bg p-6">
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Libellé"><input name="label" defaultValue={address?.label ?? "Domicile"} className="field-swiss" /></Field>
        <Field label="Nom complet" error={err("fullName")}><input name="fullName" defaultValue={address?.fullName} required className="field-swiss" /></Field>
      </div>
      <Field label="Téléphone" error={err("phone")}><input name="phone" defaultValue={address?.phone} required className="field-swiss" /></Field>
      <Field label="Adresse" error={err("line1")}><input name="line1" defaultValue={address?.line1} required className="field-swiss" /></Field>
      <Field label="Complément"><input name="line2" defaultValue={address?.line2 ?? ""} className="field-swiss" /></Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Gouvernorat" error={err("governorate")}><select name="governorate" defaultValue={address?.governorate ?? "Ben Arous"} className="field-swiss">{GOVERNORATES.map((g) => <option key={g}>{g}</option>)}</select></Field>
        <Field label="Ville" error={err("city")}><input name="city" defaultValue={address?.city} required className="field-swiss" /></Field>
        <Field label="Code postal"><input name="postalCode" defaultValue={address?.postalCode ?? ""} className="field-swiss" /></Field>
      </div>
      <label className="flex items-center gap-3 font-sans text-[13px]"><input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} /> Adresse par défaut</label>
      <div className="flex gap-3"><button disabled={pending} className="btn-primary">Enregistrer</button>{onDone && <button type="button" onClick={onDone} className="btn-ghost">Annuler</button>}</div>
    </form>
  );
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [pending, start] = useTransition();
  const { toast } = useToast();
  return (
    <div className="grid gap-px bg-line border border-line">
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm key={a.id} address={a} onDone={() => setEditing(null)} />
        ) : (
          <div key={a.id} className="bg-bg p-6 flex justify-between gap-6">
            <div>
              <p className="font-sans text-[14px] font-medium">{a.label} {a.isDefault && <span className="ml-2 border border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">Défaut</span>}</p>
              <p className="mt-3 font-sans text-[13px] leading-[1.5]">{a.fullName} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.governorate} {a.postalCode}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditing(a.id)} className="font-mono text-[11px] uppercase tracking-[0.12em] underline">Modifier</button>
              <button disabled={pending} onClick={() => start(async () => { const r = await deleteAddressAction(a.id); toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "" : r.error }); })} className="font-mono text-[11px] uppercase tracking-[0.12em] text-error underline">Supprimer</button>
            </div>
          </div>
        ),
      )}
      {editing === "new" ? (
        <AddressForm onDone={() => setEditing(null)} />
      ) : (
        <button onClick={() => setEditing("new")} className="bg-bg p-6 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted hover:text-ink border border-dashed border-line">+ Ajouter une adresse</button>
      )}
    </div>
  );
}
