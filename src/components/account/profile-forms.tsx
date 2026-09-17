"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { changePasswordAction, deleteAddressAction, saveAddressAction, updateProfileAction } from "@/actions/auth";
import { Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { AccountCard } from "@/components/account/account-ui";
import { GOVERNORATES } from "@/lib/tunisia";
import type { Address } from "@/db/schema";
import type { ActionResult } from "@/lib/api";
import { HomeIcon, MapPinIcon } from "@/components/icons";

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
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" error={err("firstName")}>
          <input name="firstName" defaultValue={user.firstName} className="field-box" />
        </Field>
        <Field label="Nom" error={err("lastName")}>
          <input name="lastName" defaultValue={user.lastName} className="field-box" />
        </Field>
      </div>
      <Field label="E-mail" hint="L'adresse de connexion ne peut pas être modifiée.">
        <input value={user.email} disabled className="field-box opacity-60" />
      </Field>
      <Field label="Téléphone" error={err("phone")}>
        <input name="phone" defaultValue={user.phone ?? ""} inputMode="tel" className="field-box" />
      </Field>
      <div>
        <button disabled={pending} className="btn-solid">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  useFeedback(state);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="max-w-md space-y-5">
      <Field label="Mot de passe actuel" error={err("current")}>
        <input name="current" type="password" autoComplete="current-password" required className="field-box" />
      </Field>
      <Field label="Nouveau mot de passe" error={err("next")} hint="8 caractères minimum.">
        <input name="next" type="password" autoComplete="new-password" minLength={8} required className="field-box" />
      </Field>
      <div>
        <button disabled={pending} className="btn-solid">
          Modifier
        </button>
      </div>
    </form>
  );
}

export function AddressForm({ address, onDone }: { address?: Address; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveAddressAction, null);
  useFeedback(state);
  useEffect(() => {
    if (state?.ok) onDone?.();
  }, [state, onDone]);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-5 rounded-[3px] border border-iodine-deep/30 bg-mist/60 p-6">
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Libellé">
          <input name="label" defaultValue={address?.label ?? "Domicile"} className="field-box" />
        </Field>
        <Field label="Nom complet" error={err("fullName")}>
          <input name="fullName" defaultValue={address?.fullName} required className="field-box" />
        </Field>
      </div>
      <Field label="Téléphone" error={err("phone")}>
        <input name="phone" defaultValue={address?.phone} inputMode="tel" required className="field-box" />
      </Field>
      <Field label="Adresse" error={err("line1")}>
        <input name="line1" defaultValue={address?.line1} required className="field-box" />
      </Field>
      <Field label="Complément (facultatif)">
        <input name="line2" defaultValue={address?.line2 ?? ""} className="field-box" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Gouvernorat" error={err("governorate")}>
          <select name="governorate" defaultValue={address?.governorate ?? "Ben Arous"} className="field-box">
            {GOVERNORATES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Ville" error={err("city")}>
          <input name="city" defaultValue={address?.city} required className="field-box" />
        </Field>
        <Field label="Code postal">
          <input name="postalCode" defaultValue={address?.postalCode ?? ""} inputMode="numeric" className="field-box" />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm text-carbon">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 accent-carbon" />
        Adresse par défaut
      </label>
      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className="btn-solid">
          Enregistrer
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="btn-outline">
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [pending, start] = useTransition();
  const { toast } = useToast();
  return (
    <div className="grid gap-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm key={a.id} address={a} onDone={() => setEditing(null)} />
        ) : (
          <AccountCard key={a.id} hover={false} className="group/addr">
            <div className="flex flex-wrap items-start justify-between gap-5 p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-line/60 bg-mist/60 text-iodine-deep">
                    {a.isDefault ? <HomeIcon size={15} /> : <MapPinIcon size={15} />}
                  </span>
                  <p className="font-ant uppercase text-[16px] text-carbon">{a.label}</p>
                  {a.isDefault && (
                    <span className="bg-iodine-wash px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-iodine-deep">
                      Par défaut
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-carbon">
                  {a.fullName} · {a.phone}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.governorate} {a.postalCode}
                </p>
              </div>
              <div className="flex shrink-0 gap-5">
                <button
                  onClick={() => setEditing(a.id)}
                  className="min-h-11 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-carbon"
                >
                  Modifier
                </button>
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await deleteAddressAction(a.id);
                      toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "" : r.error });
                    })
                  }
                  className="min-h-11 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-crit"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </AccountCard>
        ),
      )}
      {editing === "new" ? (
        <AddressForm onDone={() => setEditing(null)} />
      ) : (
        <button
          onClick={() => setEditing("new")}
          className="rounded-[3px] border border-dashed border-line-strong/80 px-6 py-5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:border-iodine-deep/60 hover:text-iodine-deep"
        >
          Ajouter une adresse
        </button>
      )}
    </div>
  );
}
