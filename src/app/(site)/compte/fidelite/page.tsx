import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getVipSummary } from "@/lib/vip";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fidélité" };

export default async function FidelitePage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.vip;
  const summary = await getVipSummary(me.id);
  const untilNext = summary.balance >= 1000 ? 0 : 1000 - summary.inBlock;

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">06 — {t.kicker}</p>
        <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">{t.title}</h1>
        <p className="mt-2 max-w-[50ch] font-sans text-[13px] leading-[1.5] text-text-secondary">{t.intro}</p>
      </div>

      <div className="mt-8 grid gap-px bg-line border border-line">
        <div className="bg-ink text-paper p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-paper/60">{t.balance}</p>
          <p className="mt-4 font-sans text-[48px] font-bold leading-none tracking-[-0.03em]">{summary.balance} <span className="text-[14px] font-normal tracking-[0.12em] uppercase opacity-60">{t.points}</span></p>
          <p className="mt-4 font-mono text-[11px] text-paper/60">{t.lifetime.replace("{n}", summary.lifetime.toLocaleString("fr-FR"))}</p>
          <div className="mt-8">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-paper/60"><span>{t.nextReward}</span><span>{t.rewardValue}</span></div>
            <div className="mt-2 h-[2px] w-full bg-paper/20"><div className="h-full bg-paper" style={{ width: `${(summary.inBlock / 1000) * 100}%` }} /></div>
            <p className="mt-3 font-mono text-[11px] text-paper/80">{untilNext === 0 ? t.rewardReady : t.untilNext.replace("{n}", untilNext.toLocaleString("fr-FR"))}</p>
          </div>
        </div>
      </div>

      {summary.blocks > 0 && (
        <div className="mt-6 border border-line bg-bg p-6">
          <div className="flex justify-between items-end">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{t.advantages}</p><p className="mt-2 font-sans text-[20px] font-semibold">{summary.blocks} × {t.rewardValue}</p></div>
            <Link href="/panier" className="btn-primary">{t.useAtTill} →</Link>
          </div>
          <div className="mt-6 grid gap-px bg-line border border-line sm:grid-cols-3">
            {Array.from({ length: Math.min(summary.blocks, 6) }).map((_, i) => (
              <div key={i} className="bg-bg-2 p-4 border-l-2 border-l-ink"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{t.nextReward}</p><p className="mt-2 font-sans text-[20px] font-semibold">{t.rewardValue}</p></div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border border-line bg-bg p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{t.howItWorks}</p>
        <p className="mt-3 font-sans text-[14px] leading-[1.7]">{t.howText}</p>
        <p className="mt-4 border-t border-line pt-4 font-mono text-[11px] text-text-secondary">{t.redeemHint}</p>
        <Link href="/boutique" className="btn-ghost mt-6 inline-flex">Explorer →</Link>
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <h2 className="font-sans text-[18px] font-semibold">{t.history}</h2>
        {summary.recent.length === 0 ? (
          <p className="mt-6 border border-dashed border-line p-8 text-center font-mono text-[12px] text-text-muted">{t.noHistory}</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {summary.recent.slice(0, 24).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0"><span className="block truncate font-sans text-[13px]">{r.reason}</span><span className="font-mono text-[11px] text-text-muted">{r.orderNumber ?? ""}</span></span>
                <span className="flex items-center gap-4"><span className={`font-mono text-[13px] ${r.points > 0 ? "text-success" : "text-ink"}`}>{r.points > 0 ? "+" : ""}{r.points}</span><span className="font-mono text-[11px] text-text-muted hidden sm:block">{formatDate(r.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
