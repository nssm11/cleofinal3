import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getVipSummary } from "@/lib/vip";
import { formatDate } from "@/lib/utils";
import { ArrowRightIcon, StarIcon } from "@/components/icons";
import { AccountCard, cardPad } from "@/components/account/account-ui";
import { SectionBrow } from "@/components/orders/order-cards";
import { CountUp, MeterBar } from "@/components/account/account-motion";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fidélité" };

/**
 * LE CERCLE — loyalty as a membership, not a game.
 *
 * One balance set large, the advantages the balance already holds drawn as
 * plates (1 000 points = 10 DT, read from the committed ledger — the client
 * never decides an amount), the road to the next plate as a quiet meter, the
 * rule of the house in plain words, and the ledger of every point that has
 * ever moved, each row pointing at its order. No tiers, no gifts, no
 * gamification — a balance and a till.
 */
export default async function FidelitePage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.vip;
  const summary = await getVipSummary(me.id);

  const untilNext = summary.balance >= 1000 ? 0 : 1000 - summary.inBlock;
  const kindLabel = (kind: string) =>
    kind === "redeem" ? t.kindRedeem : kind === "reversal" ? t.kindReversal : kind === "restore" ? t.kindRestore : t.kindAward;

  return (
    <div className="max-w-[64rem]">
      <SectionBrow index="06" eyebrow={t.kicker} title={t.title} description={t.intro} />

      {/* ── The balance + the road to the next reward ─────────────────── */}
      <Reveal y={14} amount={0.05} className="mt-9">
        <AccountCard accent>
          <div className={`${cardPad} grid gap-10 sm:grid-cols-[auto_1fr] sm:gap-14`}>
            <div>
              <p className="kicker-xs mb-4">{t.balance}</p>
              <p className="font-ant uppercase text-[clamp(3rem,6vw,4.4rem)] leading-none text-carbon">
                <CountUp value={summary.balance} duration={1.15} />
                <span className="ms-3 text-[0.24em] font-bold uppercase tracking-[0.24em] text-faint">{t.points}</span>
              </p>
              <p className="mt-5 text-[12.5px] text-muted">
                {t.lifetime.replace("{n}", summary.lifetime.toLocaleString("fr-FR"))}
              </p>
            </div>

            <div className="flex flex-col justify-center sm:border-l sm:border-line/60 sm:pl-12">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">{t.nextReward}</p>
                <p className="font-ant uppercase text-[15px] text-carbon">{t.rewardValue}</p>
              </div>
              <MeterBar value={summary.inBlock} max={1000} className="mt-4" />
              <p className="mt-4 text-[13px] text-muted">
                {untilNext === 0 ? (
                  <span className="font-medium text-iodine-deep">{t.rewardReady}</span>
                ) : (
                  t.untilNext.replace("{n}", untilNext.toLocaleString("fr-FR"))
                )}
              </p>
            </div>
          </div>
        </AccountCard>
      </Reveal>

      {/* ── The advantages the balance already holds ──────────────────── */}
      {summary.blocks > 0 && (
        <Reveal y={14} delay={0.04} amount={0.05} className="mt-6">
          <AccountCard>
            <div className={cardPad}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="kicker mb-3 text-iodine-deep">{t.advantages}</p>
                  <p className="font-ant uppercase text-[clamp(1.6rem,3.4vw,2.2rem)] leading-tight text-carbon">
                    {summary.blocks} × {t.rewardValue}
                  </p>
                </div>
                <Link href="/panier" className="btn-solid">
                  {t.useAtTill} <ArrowRightIcon size={12} />
                </Link>
              </div>
              <ul aria-label={t.advantages} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: Math.min(summary.blocks, 6) }).map((_, i) => (
                  <li
                    key={i}
                    className="relative overflow-hidden border border-iodine-deep/35 bg-porcelain px-5 py-4"
                  >
                    <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-iodine-deep" />
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-iodine-deep">
                      <StarIcon size={12} /> {t.nextReward}
                    </p>
                    <p className="mt-2 font-ant uppercase text-[26px] leading-none text-carbon">{t.rewardValue}</p>
                  </li>
                ))}
              </ul>
              {summary.blocks > 6 && (
                <p className="mt-4 text-[12.5px] text-muted">+ {summary.blocks - 6} × {t.rewardValue}</p>
              )}
              <p className="mt-4 border-t border-line/60 pt-4 text-[13px] leading-relaxed text-muted">{t.advantagesHint}</p>
            </div>
          </AccountCard>
        </Reveal>
      )}

      {/* ── The rule of the house ─────────────────────────────────────── */}
      <Reveal y={14} delay={0.08} amount={0.05} className="mt-6">
        <AccountCard>
          <div className={cardPad}>
            <p className="kicker mb-5 text-iodine-deep">{t.howItWorks}</p>
            <p className="text-[14px] leading-[1.85] text-carbon">{t.howText}</p>
            <p className="mt-5 flex items-start gap-3 border-t border-line/60 pt-5 text-[13px] text-iodine-deep">
              <StarIcon size={14} className="mt-0.5 shrink-0" />
              {t.redeemHint}
            </p>
            <Link href="/boutique" className="btn-outline mt-7 inline-flex">
              {t.browseShop} <ArrowRightIcon size={12} />
            </Link>
          </div>
        </AccountCard>
      </Reveal>

      {/* ── The ledger ────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionBrow eyebrow={t.history} title={t.history} />
        {summary.recent.length === 0 ? (
          <Reveal y={10} className="mt-7">
            <p className="rounded-[3px] border border-dashed border-line-strong/70 bg-mist/50 px-6 py-12 text-center text-[13.5px] text-muted">
              {t.noHistory}
            </p>
          </Reveal>
        ) : (
          <Reveal y={12} className="mt-7">
            <AccountCard hover={false}>
              <ul className="divide-y divide-line/60">
                {summary.recent.slice(0, 24).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-5 px-6 py-4">
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-carbon">{r.reason}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-faint">
                        <span
                          className={`font-bold uppercase tracking-[0.14em] ${r.points > 0 ? "text-ok" : "text-iodine-deep"}`}
                        >
                          {kindLabel(r.kind)}
                        </span>
                        {r.orderNumber && (
                          <Link
                            href={`/compte/commandes/${encodeURIComponent(r.orderNumber)}`}
                            className="link-underline tabular-nums"
                            aria-label={`${t.viewOrder} ${r.orderNumber}`}
                          >
                            {r.orderNumber}
                          </Link>
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-5">
                      <span
                        className={`text-[14px] font-medium tabular-nums ${r.points > 0 ? "text-ok" : "text-iodine-deep"}`}
                      >
                        {r.points > 0 ? "+" : ""}
                        {r.points.toLocaleString("fr-FR")}
                      </span>
                      <span className="hidden w-28 text-right text-[11.5px] tabular-nums text-faint sm:block">
                        {formatDate(r.createdAt)}
                      </span>
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
