"use client";

import { useState } from "react";
import { GiftIcon } from "@/components/icons";
import { formatDT } from "@/lib/money";

/**
 * THE ENVELOPE'S QUESTION — a gift-card balance checker.
 *
 * Code in, balance out: the endpoint answers with money and status only,
 * never identity, and unknown codes read exactly like spent ones.
 */
type Answer =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "unknown" }
  | { state: "known"; balanceMillimes: number; status: string; expiresAt: string | null }
  | { state: "error"; message: string };

const STATUS_FR: Record<string, string> = {
  active: "Active",
  redeemed: "Épuisée",
  expired: "Expirée",
  cancelled: "Annulée",
};

export function GiftBalanceChecker() {
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState<Answer>({ state: "idle" });

  const check = async () => {
    const v = code.trim();
    if (v.length < 8) {
      setAnswer({ state: "error", message: "Saisissez le code complet de la carte." });
      return;
    }
    setAnswer({ state: "checking" });
    try {
      const r = await fetch("/api/gift-cards/balance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: v }),
      });
      if (r.status === 429) {
        setAnswer({ state: "error", message: "Trop de vérifications — patientez quelques minutes." });
        return;
      }
      if (!r.ok) throw new Error("bad");
      const d = (await r.json()) as { known?: boolean; balanceMillimes?: number; status?: string; expiresAt?: string | null };
      if (!d.known) setAnswer({ state: "unknown" });
      else setAnswer({ state: "known", balanceMillimes: d.balanceMillimes ?? 0, status: d.status ?? "active", expiresAt: d.expiresAt ?? null });
    } catch {
      setAnswer({ state: "error", message: "La vérification a échoué — réessayez dans un instant." });
    }
  };

  return (
    <div className="relative overflow-hidden border border-champagne-2/35 bg-gradient-to-br from-champagne-soft/60 via-ivory to-cream p-7 sm:p-9 lg:sticky lg:top-28">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-champagne-2 to-transparent" />
      <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-champagne-2">
        <GiftIcon size={15} /> Vérifier un solde
      </p>
      <p className="mt-4 font-display text-[clamp(1.4rem,2.8vw,1.8rem)] leading-snug text-ink">
        Combien reste-t-il sur votre carte&nbsp;?
      </p>
      <div className="mt-6">
        <label htmlFor="gift-code" className="sr-only">Code de la carte cadeau</label>
        <input
          id="gift-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          placeholder="CLEO-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="field font-mono uppercase tracking-wide"
        />
        <button onClick={check} disabled={answer.state === "checking"} className="btn-primary mt-4 w-full">
          {answer.state === "checking" ? "Vérification…" : "Voir le solde"}
        </button>
      </div>

      <div aria-live="polite" className="mt-6">
        {answer.state === "known" && (
          <div className="border-t border-champagne-2/30 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">Solde disponible</p>
            <p className="mt-2 font-display text-[clamp(2rem,4vw,2.6rem)] leading-none tabular-nums text-ink">
              {formatDT(answer.balanceMillimes)}
            </p>
            <p className="mt-3 text-[12.5px] text-muted">
              Carte {STATUS_FR[answer.status] ?? answer.status}
              {answer.expiresAt ? ` · expire le ${new Date(answer.expiresAt).toLocaleDateString("fr-TN")}` : ""}
            </p>
          </div>
        )}
        {answer.state === "unknown" && (
          <p className="border border-error/25 bg-error-soft/60 px-4 py-3 text-[13px] leading-relaxed text-error" role="alert">
            Ce code ne correspond à aucune carte de la maison. Vérifiez-le lettre par lettre.
          </p>
        )}
        {answer.state === "error" && (
          <p className="border border-error/25 bg-error-soft/60 px-4 py-3 text-[13px] leading-relaxed text-error" role="alert">
            {answer.message}
          </p>
        )}
      </div>
    </div>
  );
}
