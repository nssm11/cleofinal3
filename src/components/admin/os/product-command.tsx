"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustStockAction } from "@/actions/admin";
import { setProductFlagsAction } from "@/actions/admin-os";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Glyph } from "./icons";
import { OsButton } from "./primitives";

/* ══════════════════════════════════════════════════════════════════════════
   COMMANDES DE LA FICHE
   ──────────────────────────────────────────────────────────────────────────
   The four decisions an operator actually makes on a product page — publish
   or retire, put it forward, move the restock threshold, correct the count —
   without leaving the page or opening a form. Stock corrections demand a
   reason, because the ledger is the only thing that explains a count later.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUSES: { key: "active" | "draft" | "archived"; label: string; hint: string }[] = [
  { key: "active", label: "En ligne", hint: "Visible et achetable sur la boutique" },
  { key: "draft", label: "Brouillon", hint: "En préparation, invisible" },
  { key: "archived", label: "Archivé", hint: "Retiré du catalogue — la fiche et l'historique restent" },
];

export function ProductCommandOs({
  id, name, status, isFeatured, isCounterPick, isNew, threshold, stock,
}: {
  id: number; name: string; status: string; isFeatured: boolean; isCounterPick: boolean; isNew: boolean; threshold: number; stock: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(status);
  const [flags, setFlags] = useState({ isFeatured, isCounterPick, isNew });
  const [limit, setLimit] = useState(threshold);

  const [adjusting, setAdjusting] = useState(false);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const run = (patch: Parameters<typeof setProductFlagsAction>[1], optimistic?: () => void) =>
    start(async () => {
      optimistic?.();
      const r = await setProductFlagsAction(id, patch);
      if (r.ok) {
        toast({ kind: "success", title: r.message ?? "Fiche mise à jour." });
        router.refresh();
      } else {
        toast({ kind: "error", title: r.error });
        setCurrent(status);
        setFlags({ isFeatured, isCounterPick, isNew });
        setLimit(threshold);
        router.refresh();
      }
    });

  const submitAdjust = () =>
    start(async () => {
      const form = new FormData();
      form.set("productId", String(id));
      form.set("delta", delta);
      form.set("reason", reason);
      const r = await adjustStockAction(null, form);
      if (r.ok) {
        toast({ kind: "success", title: r.message ?? "Stock ajusté." });
        setAdjusting(false);
        setDelta("");
        setReason("");
        router.refresh();
      } else {
        toast({ kind: "error", title: r.error });
      }
    });

  const deltaNum = Number(delta);
  const validDelta = delta.trim() !== "" && Number.isFinite(deltaNum) && deltaNum !== 0 && stock + deltaNum >= 0;

  return (
    <div className="border border-os-line bg-os-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-os-line px-3 py-2.5">
        <span className="os-label text-os-faint">Statut de vente</span>
        <div className="flex flex-wrap gap-px bg-os-line">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              disabled={pending || current === s.key}
              onClick={() => { setCurrent(s.key); run({ status: s.key }); }}
              title={s.hint}
              className={cn(
                "px-3 py-1.5 text-[11.5px] uppercase tracking-[0.1em] transition-colors disabled:cursor-default",
                current === s.key ? "bg-os-ink text-os-onink" : "bg-os-surface text-os-muted hover:bg-os-surface-2 hover:text-os-text",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {pending && <span className="os-num text-[11px] text-os-faint">écriture…</span>}
      </div>

      <div className="grid gap-px bg-os-line sm:grid-cols-2">
        {([
          ["isFeatured", "Mise en avant", "Apparaît en tête de rayon et sur l'accueil"],
          ["isCounterPick", "Choix du comptoir", "Recommandée par la maison au comptoir"],
          ["isNew", "Nouveauté", "Marquée nouvelle arrivée, badge boutique"],
        ] as const).map(([key, label, hint]) => (
          <button
            key={key}
            disabled={pending}
            onClick={() => { const next = !flags[key]; setFlags((f) => ({ ...f, [key]: next })); run({ [key]: next }); }}
            className="flex items-center gap-2.5 bg-os-surface px-3 py-2.5 text-left transition-colors hover:bg-os-surface-2"
            title={hint}
          >
            <span className={cn("grid h-4 w-4 place-items-center border", flags[key] ? "border-os-ok bg-os-ok text-os-onink" : "border-os-line-strong bg-os-surface")}>
              {flags[key] && <Glyph name="check" size={10} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] text-os-text">{label}</span>
              <span className="block truncate text-[11px] text-os-faint">{hint}</span>
            </span>
          </button>
        ))}
        <div className="flex items-center gap-2.5 bg-os-surface px-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] text-os-text">Seuil de réassort</span>
            <span className="block text-[11px] text-os-faint">Alerte dès {limit} unité{limit > 1 ? "s" : ""} — actuellement {stock} en stock</span>
          </span>
          <input
            type="number"
            min={0}
            value={limit}
            onChange={(e) => setLimit(Math.max(0, Number(e.target.value) || 0))}
            className="os-num h-8 w-16 border border-os-line bg-os-surface px-2 text-right text-[12.5px] focus:border-os-line-strong focus:outline-none"
          />
          <OsButton size="sm" variant="ghost" disabled={pending || limit === threshold} onClick={() => run({ lowStockThreshold: limit })}>Fixer</OsButton>
        </div>
      </div>

      <div className="border-t border-os-line px-3 py-2.5">
        {!adjusting ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11.5px] text-os-muted">
              Toute correction de stock est un mouvement de registre : elle est datée, attribuée et expliquée.
            </p>
            <OsButton size="sm" variant="ghost" onClick={() => setAdjusting(true)}>Corriger le stock</OsButton>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <label className="block">
              <span className="os-label text-os-muted">Quantité (±)</span>
              <input
                autoFocus
                value={delta}
                onChange={(e) => { setDelta(e.target.value); setConfirming(false); }}
                placeholder="+24 ou -3"
                className="os-num mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="os-label text-os-muted">Motif (obligatoire)</span>
              <input
                value={reason}
                onChange={(e) => { setReason(e.target.value); setConfirming(false); }}
                placeholder="Réception fournisseur, casse, test interne…"
                className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none"
              />
            </label>
            <div className="flex items-end gap-2">
              {confirming ? (
                <>
                  <OsButton size="md" variant="gold" disabled={pending} onClick={submitAdjust}>
                    Confirmer {deltaNum > 0 ? `+${deltaNum}` : deltaNum} → {stock + deltaNum}
                  </OsButton>
                  <OsButton size="md" variant="quiet" onClick={() => setConfirming(false)}>Annuler</OsButton>
                </>
              ) : (
                <OsButton size="md" variant="primary" disabled={!validDelta || !reason.trim()} onClick={() => setConfirming(true)}>Vérifier</OsButton>
              )}
            </div>
            {delta.trim() !== "" && !validDelta && (
              <p className="text-[11.5px] text-os-crit sm:col-span-3">
                {stock + deltaNum < 0 ? `Impossible : ${stock} en stock, un retrait de ${Math.abs(deltaNum)} rendrait le compte négatif.` : "Saisissez un écart non nul."}
              </p>
            )}
            {confirming && (
              <p className="text-[11.5px] text-os-muted sm:col-span-3">
                Sera écrit : <span className="text-os-text">{name}</span> {stock} → <span className="os-num text-os-text">{stock + deltaNum}</span>, motif « {reason.trim()} »{deltaNum > 0 && stock === 0 ? ". Le stock repassant au-dessus de zéro, les clientes en alerte de réapprovisionnement recevront la lettre." : "."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
