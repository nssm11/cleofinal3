"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDuoAction,
  deleteShelfAction,
  saveBrandPicksAction,
  saveDuoAction,
  saveRoutineAction,
  saveShelfAction,
  saveSubstitutesAction,
} from "@/actions/admin";
import type { ActionResult } from "@/lib/api";
import type { LText } from "@/db/schema";
import { useToast } from "@/components/ui/toaster";
import { AField, afield } from "./ui";

/**
 * LA MISE EN SCÈNE — forms behind /admin/mise-en-scene (P01).
 *
 * Products are addressed by slug, never by raw id: the office works from the
 * printed label, and a typo must fail loudly (“Slug inconnu”) instead of
 * silently pointing a shelf at somebody else’s reference.
 */

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function useNotify(state: ActionResult<unknown> | null) {
  const { toast } = useToast();
  const router = useRouter();
  useEffect(() => {
    if (!state) return;
    toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "Enregistré." : state.error });
    if (state.ok) router.refresh();
  }, [state, toast, router]);
}

/** One thought, three tongues — the French is what must exist. */
export function L3({ name, value }: { name: string; value?: LText | null }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <input name={`${name}-fr`} defaultValue={value?.fr ?? ""} placeholder="Français" className={afield} />
      <input name={`${name}-tn`} defaultValue={value?.tn ?? ""} placeholder="Tounsi (latin)" className={afield} />
      <input name={`${name}-tna`} defaultValue={value?.tna ?? ""} placeholder="تونسي" dir="rtl" className={afield} />
    </div>
  );
}

export function MerchSlugOptions({ products }: { products: { slug: string; name: string; stock: number }[] }) {
  return (
    <datalist id="merch-slugs">
      {products.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name} — stock {p.stock}
        </option>
      ))}
    </datalist>
  );
}

export type ShelfRow = { id: number; title: LText; subtitle: LText | null; startMonth: number; endMonth: number; slugs: string[]; isActive: boolean };
export function ShelfForm({ initial }: { initial?: ShelfRow | null }) {
  const [state, action, pending] = useActionState(saveShelfAction, null);
  useNotify(state);
  return (
    <form action={action} className="space-y-3 border border-admin-border bg-admin-panel p-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-admin-gold">{initial ? `Modifier « ${initial.title.fr} »` : "Nouvelle vitrine"}</p>
      <AField label="Titre (FR · tounsi · تونسي)"><L3 name="titre" value={initial?.title} /></AField>
      <AField label="Sur-titre (facultatif)"><L3 name="sub" value={initial?.subtitle} /></AField>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_2fr]">
        <AField label="Mois de début">
          <select name="startMonth" defaultValue={initial?.startMonth ?? 4} className={afield}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </AField>
        <AField label="Mois de fin">
          <select name="endMonth" defaultValue={initial?.endMonth ?? 9} className={afield}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </AField>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4 accent-champagne" /> Visible
        </label>
      </div>
      <AField label="Références — un slug par ligne, dans l’ordre d’accroche"><textarea name="slugs" rows={3} defaultValue={initial?.slugs.join("\n") ?? ""} className={`${afield} font-mono text-xs`} placeholder={"la-roche-posay-anthelios-…"} /></AField>
      <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 bg-admin-gold px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-noir disabled:opacity-40">{pending ? "Enregistrement…" : "Enregistrer la vitrine"}</button>
    </form>
  );
}

export function ShelfDelete({ id }: { id: number }) {
  const router = useRouter();
  return (
    <form
      action={async (fd) => {
        await deleteShelfAction(fd);
        router.refresh();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-xs text-admin-muted underline decoration-dotted hover:text-red-400">Retirer</button>
    </form>
  );
}

export type DuoRow = { id: number; name: LText; note: string | null; slugA: string; slugB: string; nameA: string; nameB: string; discountDT: string; isActive: boolean };
export function DuoForm({ initial }: { initial?: DuoRow | null }) {
  const [state, action, pending] = useActionState(saveDuoAction, null);
  useNotify(state);
  return (
    <form action={action} className="space-y-3 border border-admin-border bg-admin-panel p-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-admin-gold">{initial ? `Modifier « ${initial.name.fr} »` : "Nouveau duo"}</p>
      <AField label="Nom du duo"><L3 name="nom" value={initial?.name} /></AField>
      <div className="grid gap-3 sm:grid-cols-2">
        <AField label="Référence 1 (slug)"><input name="slugA" defaultValue={initial?.slugA ?? ""} list="merch-slugs" className={`${afield} font-mono text-xs`} required /></AField>
        <AField label="Référence 2 (slug)"><input name="slugB" defaultValue={initial?.slugB ?? ""} list="merch-slugs" className={`${afield} font-mono text-xs`} required /></AField>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[160px_1fr]">
        <AField label="Remise (DT)"><input name="discountDT" type="text" inputMode="decimal" defaultValue={initial?.discountDT ?? "5"} className={afield} /></AField>
        <AField label="Note (ce que le duo règle ensemble)"><input name="note" defaultValue={initial?.note ?? ""} maxLength={500} className={afield} /></AField>
      </div>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4 accent-champagne" /> Proposé en boutique en ligne
      </label>
      <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 bg-admin-gold px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-noir disabled:opacity-40">{pending ? "Enregistrement…" : "Enregistrer le duo"}</button>
    </form>
  );
}

export function DuoDelete({ id }: { id: number }) {
  const router = useRouter();
  return (
    <form
      action={async (fd) => {
        await deleteDuoAction(fd);
        router.refresh();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-xs text-admin-muted underline decoration-dotted hover:text-red-400">Retirer</button>
    </form>
  );
}

export type RoutineStepInit = { pos: number; slug: string; label: LText | null; reason: LText | null };
export function RoutineForm({ concerns, stepsByConcern, selectedId }: { concerns: { id: number; name: string; slug: string }[]; stepsByConcern: Record<number, RoutineStepInit[]>; selectedId: number }) {
  const [state, action, pending] = useActionState(saveRoutineAction, null);
  useNotify(state);
  // Changing the need reloads the three gesture fields — same rule as the
  // brand form: never submit one concern’s ritual under another concern.
  const [cid, setCid] = useState(selectedId);
  const steps = stepsByConcern[cid] ?? [];
  const row = (pos: number) => steps.find((x) => x.pos === pos);
  return (
    <form key={cid} action={action} className="space-y-4 border border-admin-border bg-admin-panel p-4">
      <AField label="Besoin">
        <select name="concernId" value={cid} onChange={(e) => setCid(Number(e.target.value) || 0)} className={afield}>
          {concerns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </AField>
      <p className="text-[11px] text-admin-muted">Trois gestes, dans l’ordre. Laisser vide et enregistrer retire le rituel de la page.</p>
      {[1, 2, 3].map((pos) => (
        <div key={pos} className="space-y-2 border-t border-admin-border pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-admin-gold">Geste {pos}</p>
          <input name={`p${pos}`} defaultValue={row(pos)?.slug ?? ""} list="merch-slugs" placeholder="slug du produit" className={`${afield} font-mono text-xs`} />
          <L3 name={`l${pos}`} value={row(pos)?.label} />
          <L3 name={`r${pos}`} value={row(pos)?.reason} />
        </div>
      ))}
      <button disabled={pending || !cid} className="inline-flex min-h-11 items-center gap-2 bg-admin-gold px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-noir disabled:opacity-40">{pending ? "Enregistrement…" : "Enregistrer le rituel"}</button>
    </form>
  );
}

export type SubRow = { slug: string; name: string; reason: LText | null };
export function SubstitutesForm({ selectedSlug, current }: { selectedSlug: string; current: SubRow[] }) {
  const [state, action, pending] = useActionState(saveSubstitutesAction, null);
  useNotify(state);
  return (
    <form action={action} className="space-y-3 border border-admin-border bg-admin-panel p-4">
      <AField label="Référence en rupture (slug)"><input name="productSlug" defaultValue={selectedSlug} list="merch-slugs" className={`${afield} font-mono text-xs`} required /></AField>
      {[1, 2].map((pos) => (
        <div key={pos} className="space-y-2 border-t border-admin-border pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-admin-gold">Remplaçant {pos}</p>
          <input name={`s${pos}`} defaultValue={current[pos - 1]?.slug ?? ""} list="merch-slugs" placeholder="slug du substitut" className={`${afield} font-mono text-xs`} />
          <L3 name={`rs${pos}`} value={current[pos - 1]?.reason} />
        </div>
      ))}
      <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 bg-admin-gold px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-noir disabled:opacity-40">{pending ? "Enregistrement…" : "Enregistrer les substitutions"}</button>
    </form>
  );
}

export function BrandForm({ brands, selectedSlug }: { brands: { slug: string; name: string; story: string | null; heroSlugs: string[] }[]; selectedSlug: string }) {
  const [state, action, pending] = useActionState(saveBrandPicksAction, null);
  useNotify(state);
  // Selecting a laboratory reloads its fields — the form can never submit
  // one brand’s story under another brand’s slug.
  const [slugSel, setSlugSel] = useState(selectedSlug);
  const cur = brands.find((b) => b.slug === slugSel) ?? null;
  return (
    <form action={action} className="space-y-3 border border-admin-border bg-admin-panel p-4">
      <AField label="Laboratoire">
        <select name="brandSlug" value={slugSel} onChange={(e) => setSlugSel(e.target.value)} className={afield}>
          <option value="">— choisir —</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
      </AField>
      <AField label="Histoire du laboratoire — 4 à 6 lignes, ton officinal, faits vrais"><textarea key={`s-${slugSel}`} name="story" rows={6} defaultValue={cur?.story ?? ""} className={afield} /></AField>
      <AField label="Références héro — un slug par ligne (max 3)"><textarea key={`h-${slugSel}`} name="heroSlugs" rows={3} defaultValue={cur?.heroSlugs.join("\n") ?? ""} className={`${afield} font-mono text-xs`} /></AField>
      <button disabled={pending || !cur} className="inline-flex min-h-11 items-center gap-2 bg-admin-gold px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-noir disabled:opacity-40">{pending ? "Enregistrement…" : "Enregistrer la page laboratoire"}</button>
    </form>
  );
}
