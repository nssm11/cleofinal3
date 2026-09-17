"use client";
import { useActionState, useTransition } from "react";
import { deleteQueryLandingAction, saveQueryLandingAction } from "@/actions/admin";
import { useToast } from "@/components/ui/toaster";
import { abtn, abtnGhost, afield } from "./ui";

/** Prompt 15 — the curation desk of the search log: pin a pharmacist-approved
 * door on a query that currently opens nothing (or only empty shelves). */
export function LandingForm({ presetQuery }: { presetQuery: string }) {
  const [state, action, pending] = useActionState(saveQueryLandingAction, null);
  return (
    <form action={action} className="space-y-2 border border-ops-line bg-ops-sheet p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ops-muted">Épingler une porte sur une requête</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="query" key={`q-${state?.ok ? "ok" : "e"}-${presetQuery}`} defaultValue={presetQuery} required placeholder="ex. cicaplast" className={afield} aria-label="Requête (minuscule)" />
        <select name="kind" className={afield} aria-label="Quand répondre">
          <option value="zero">Quand rien ne revient</option>
          <option value="oos">Quand tout est en rupture</option>
        </select>
      </div>
      <input name="label" required placeholder="Libellé vu par le client — ex. : « Ce que vous cherchez est là, ou nous le commandons. »" className={`${afield} w-full`} />
      <input name="href" required placeholder="/produit/… · /categorie/… · /aide…" className={`${afield} w-full`} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={abtn}>{pending ? "…" : "Épingler"}</button>
        {state && !state.ok && <span className="text-xs text-crit">{state.error}</span>}
        {state?.ok && <span className="text-xs text-ok">{state.message}</span>}
      </div>
    </form>
  );
}

export function LandingRow({ id, query, kind, label, href }: { id: number; query: string; kind: string; label: string; href: string }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-ops-line px-3.5 py-2.5 text-sm">
      <span className="min-w-0">
        <code className="text-ops-signal">« {query} »</code>{" "}
        <span className="text-[9px] uppercase tracking-[0.14em] text-ops-muted">{kind === "oos" ? "rupture" : "zéro"}</span>
        <span className="block truncate text-xs text-ops-muted">{label} → {href}</span>
      </span>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await deleteQueryLandingAction(id);
            toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "" : r.error ?? "" });
          })
        }
        className={`${abtnGhost} text-crit`}
      >
        {pending ? "…" : "Retirer"}
      </button>
    </li>
  );
}
