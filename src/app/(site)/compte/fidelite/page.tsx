import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getVipSummary } from "@/lib/vip";
import { formatDate } from "@/lib/utils";
import { ArrowRightIcon, StarIcon } from "@/components/icons";
import { AccountCard, AccountHeader, cardPad } from "@/components/account/account-ui";
import { CountUp, MeterBar } from "@/components/account/account-motion";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fidélité" };

/**
 * LE CERCLE — loyalty as a membership, not a game.
 *
 * One balance set large, the road to the next reward drawn as a quiet meter,
 * the rule of the house in plain words, and the ledger of every point that
 * has ever moved. No tiers, no gifts, no gamification — a balance and a till.
 */
export default async function FidelitePage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.vip;
  const summary = await getVipSummary(me.id);

  // The road to the next reward: 1 000 points = 10 DT at the till.
  const inBlock = summary.balance % 1000;
  const untilNext = summary.balance >= 1000 ? 0 : 1000 - inBlock;

  return (
    <div className="max-w-[64rem]">
      <AccountHeader index="05" eyebrow={t.kicker} title={t.title} description={t.intro} />

      {/* ── The balance + the road to the next reward ─────────────────── */}
      <Reveal y={14} amount={0.05} className="mt-9">
        <AccountCard accent>
          <div className={`${cardPad} grid gap-10 sm:grid-cols-[auto_1fr] sm:gap-14`}>
            <div>
              <p className="eyebrow mb-4">{t.balance}</p>
              <p className="font-display text-[clamp(3rem,6vw,4.4rem)] leading-none text-ink">
                <CountUp value={summary.balance} duration={1.15} />
                <span className="ms-3 text-[0.24em] font-bold uppercase tracking-[0.24em] text-muted-2">{t.points}</span>
              </p>
              <p className="mt-5 text-[12.5px] text-muted">
                {t.lifetime.replace("{n}", summary.lifetime.toLocaleString("fr-FR"))}
              </p>
            </div>

            <div className="flex flex-col justify-center sm:border-l sm:border-stone/60 sm:pl-12">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">Prochain avantage</p>
                <p className="font-display text-[15px] text-ink">10 DT</p>
              </div>
              <MeterBar value={inBlock} max={1000} className="mt-4" />
              <p className="mt-4 text-[13px] text-muted">
                {untilNext === 0 ? (
                  <span className="font-medium text-champagne-2">Votre avantage est prêt — pensez à l&apos;utiliser à la caisse.</span>
                ) : (
                  <>
                    Encore{" "}
                    <span className="font-medium tabular-nums text-ink">{untilNext.toLocaleString("fr-FR")} points</span> avant votre
                    prochain avantage.
                  </>
                )}
              </p>
            </div>
          </div>
        </AccountCard>
      </Reveal>

      {/* ── The rule of the house ─────────────────────────────────────── */}
      <Reveal y={14} delay={0.08} amount={0.05} className="mt-6">
        <AccountCard>
          <div className={cardPad}>
            <p className="rule-label mb-5 text-champagne-2">{t.howItWorks}</p>
            <p className="text-[14px] leading-[1.85] text-charcoal">{t.howText}</p>
            <p className="mt-5 flex items-start gap-3 border-t border-stone/60 pt-5 text-[13px] italic text-champagne-2">
              <StarIcon size={14} className="mt-0.5 shrink-0" />
              {t.redeemHint}
            </p>
            <Link href="/boutique" className="btn-secondary mt-7 inline-flex">
              Parcourir la boutique <ArrowRightIcon size={12} />
            </Link>
          </div>
        </AccountCard>
      </Reveal>

      {/* ── The ledger ────────────────────────────────────────────────── */}
      <section className="mt-12">
        <AccountHeader eyebrow={t.history} title="Le carnet" />
        {summary.recent.length === 0 ? (
          <Reveal y={10} className="mt-7">
            <p className="rounded-[3px] border border-dashed border-stone-2/70 bg-cream/50 px-6 py-12 text-center text-[13.5px] text-muted">
              {t.noHistory}
            </p>
          </Reveal>
        ) : (
          <Reveal y={12} className="mt-7">
            <AccountCard hover={false}>
              <ul className="divide-y divide-stone/60">
                {summary.recent.slice(0, 24).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-5 px-6 py-4">
                    <span className="min-w-0 truncate text-[13.5px] text-charcoal">{r.reason}</span>
                    <span className="flex shrink-0 items-baseline gap-5">
                      <span
                        className={`text-[14px] font-medium tabular-nums ${r.points > 0 ? "text-success" : "text-terra"}`}
                      >
                        {r.points > 0 ? "+" : ""}
                        {r.points.toLocaleString("fr-FR")}
                      </span>
                      <span className="w-28 text-right text-[11.5px] tabular-nums text-muted-2">{formatDate(r.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </AccountCard>
          </Reveal>
        )}
      </section>
    </div>
  );
}
