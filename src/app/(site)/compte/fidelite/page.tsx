import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getVipSummary } from "@/lib/vip";
import { formatDate } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fidélité" };

/**
 * LE CARNET — since Prompt 10, loyalty is points and nothing else: one rule
 * (1 DT = 10 points, credited on delivery), one rate (1 000 points = 10 DT at
 * the till, never more than what remains due), cancellations take their points
 * back, and there are no levels, no gifts, no gamification. The page is a
 * ledger with a rule at its head — nothing here should need a legend.
 */
export default async function FidelitePage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.vip;
  const summary = await getVipSummary(me.id);

  return (
    <section aria-labelledby="fidelite-title" className="max-w-[52rem]">
      <p className="rule-label mb-4">{t.kicker}</p>
      <h1 id="fidelite-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {t.title}
      </h1>
      <p className="mt-4 max-w-[42rem] text-[14px] leading-[1.8] text-muted">{t.intro}</p>

      {/* Balance + rule, one hairline apart */}
      <div className="mt-10 grid gap-8 border-y border-stone/70 py-10 sm:grid-cols-[auto_1fr] sm:gap-14">
        <div>
          <p className="eyebrow mb-4">{t.balance}</p>
          <p className="font-display text-[clamp(3rem,7vw,4.6rem)] leading-none tabular-nums text-ink">
            {summary.balance.toLocaleString("fr-FR")}
            <span className="ms-3 text-[0.26em] font-bold uppercase tracking-[0.24em] text-muted-2">{t.points}</span>
          </p>
          <p className="mt-4 text-[12.5px] text-muted">{t.lifetime.replace("{n}", summary.lifetime.toLocaleString("fr-FR"))}</p>
        </div>
        <div className="sm:border-l sm:border-stone/70 sm:pl-14">
          <p className="eyebrow mb-3 text-champagne-2">{t.howItWorks}</p>
          <p className="text-[13.5px] leading-[1.85] text-charcoal">{t.howText}</p>
          <p className="mt-4 text-[13px] italic text-champagne-2">{t.redeemHint}</p>
          <Link href="/boutique" className="btn-secondary mt-6 inline-flex">
            Parcourir la boutique <ArrowRightIcon size={12} />
          </Link>
        </div>
      </div>

      {/* The ledger */}
      <div className="mt-12">
        <p className="eyebrow mb-4">{t.history}</p>
        {summary.recent.length === 0 ? (
          <p className="border border-dashed border-stone-2/60 bg-cream/50 px-5 py-10 text-center text-[13px] text-muted">
            {t.noHistory}
          </p>
        ) : (
          <ul className="divide-y divide-stone/70 border-y border-stone/70">
            {summary.recent.slice(0, 24).map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-4 py-3">
                <span className="min-w-0 truncate text-[13px] text-charcoal">{r.reason}</span>
                <span className="flex shrink-0 items-baseline gap-4">
                  <span className={`text-[13px] tabular-nums ${r.points > 0 ? "text-success" : "text-terra"}`}>
                    {r.points > 0 ? "+" : ""}
                    {r.points.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[11px] text-muted-2">{formatDate(r.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
