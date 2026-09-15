"use client";

import { useState, useTransition } from "react";
import { cancelGiftCardAction, issueGiftCardAction } from "@/actions/admin";
import { Panel } from "@/components/admin/ui";
import type { GiftCardRow } from "@/lib/gift-cards";
import { liveStatus } from "@/lib/gift-cards-client";

/**
 * THE COUNTER'S MINT — gift-card issuance and ledger for staff.
 *
 * The full code is displayed exactly once, right after issuance, so the
 * counter can hand it over; afterwards only the last four characters exist
 * anywhere readable. Cancellation is confirmed — it burns real value.
 */
export function GiftCardManager({ cards, stats }: { cards: GiftCardRow[]; stats: { active: number; outstandingMillimes: number; redeemedMillimes: number } }) {
  const [pending, start] = useTransition();
  const [amountDT, setAmountDT] = useState("50");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [issued, setIssued] = useState<{ code: string; amountMillimes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dt = (m: number) => `${(m / 1000).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT`;

  const issue = () =>
    start(async () => {
      setError(null);
      setIssued(null);
      const r = await issueGiftCardAction({ amountDT: Number(amountDT), expiresAt, note });
      if (r.ok) setIssued({ code: r.data.code, amountMillimes: r.data.amountMillimes });
      else setError(r.error);
    });

  const cancel = (id: number) => {
    if (!window.confirm("Annuler cette carte ? Le solde restant sera définitivement éteint.")) return;
    start(async () => {
      setError(null);
      const r = await cancelGiftCardAction(id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Panel title="Émettre une carte">
          <div className="space-y-4 p-5">
            <div>
              <label htmlFor="gc-amount" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-os-muted">Montant (DT)</label>
              <input
                id="gc-amount"
                type="number"
                min={1}
                max={5000}
                value={amountDT}
                onChange={(e) => setAmountDT(e.target.value)}
                className="w-full border border-os-line bg-os-bg px-3 py-2.5 text-os-text"
              />
            </div>
            <div>
              <label htmlFor="gc-exp" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-os-muted">Expiration (facultatif)</label>
              <input
                id="gc-exp"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-os-line bg-os-bg px-3 py-2.5 text-os-text"
              />
            </div>
            <div>
              <label htmlFor="gc-note" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-os-muted">Note (facultatif)</label>
              <input
                id="gc-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="Offerte à l’occasion de…"
                className="w-full border border-os-line bg-os-bg px-3 py-2.5 text-os-text"
              />
            </div>
            <button onClick={issue} disabled={pending} className="w-full bg-os-gold px-4 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-os-ink transition-opacity disabled:opacity-50">
              {pending ? "Émission…" : "Émettre la carte"}
            </button>
            {error && <p role="alert" className="border border-os-danger/40 bg-os-danger/10 px-3 py-2.5 text-[13px] text-os-danger">{error}</p>}
            {issued && (
              <div className="border border-os-gold/50 bg-os-gold/10 p-4" role="status">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-os-gold">Carte émise — {dt(issued.amountMillimes)}</p>
                <p className="mt-2 select-all font-mono text-lg tracking-wide text-os-text">{issued.code}</p>
                <p className="mt-2 text-[12px] text-os-muted">Remettez ce code au client maintenant : il ne sera plus jamais affiché.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-8">
        <Panel
          title={`Cartes émises — ${stats.active} active(s), ${dt(stats.outstandingMillimes)} en circulation, ${dt(stats.redeemedMillimes)} dépensés`}
        >
          {cards.length === 0 ? (
            <p className="p-8 text-center text-[13px] text-os-muted">Aucune carte émise pour l’instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-os-line text-[10px] uppercase tracking-[0.16em] text-os-muted">
                    <th className="px-4 py-2.5">Carte</th>
                    <th className="px-4 py-2.5">Valeur</th>
                    <th className="px-4 py-2.5">Solde</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Expire</th>
                    <th className="px-4 py-2.5">Note</th>
                    <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-line">
                  {cards.map((c) => {
                    const live = liveStatus({ status: c.status, expiresAt: c.expiresAt });
                    return (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-mono text-os-text">…{c.codePrefix}</td>
                        <td className="px-4 py-3 tabular-nums text-os-text">{dt(c.initialMillimes)}</td>
                        <td className="px-4 py-3 tabular-nums text-os-text">{dt(c.balanceMillimes)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${live === "active" ? "bg-emerald-500/15 text-emerald-600" : live === "redeemed" ? "bg-os-gold/15 text-os-gold" : live === "expired" ? "bg-os-danger/10 text-os-danger" : "bg-os-surface-2 text-os-muted"}`}>
                            {live === "active" ? "Active" : live === "redeemed" ? "Épuisée" : live === "expired" ? "Expirée" : "Annulée"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-os-muted">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-TN") : "—"}</td>
                        <td className="max-w-[12rem] truncate px-4 py-3 text-os-muted">{c.note ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {live === "active" && (
                            <button onClick={() => cancel(c.id)} disabled={pending} className="text-[11px] font-bold uppercase tracking-[0.14em] text-os-danger hover:underline disabled:opacity-50">
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
