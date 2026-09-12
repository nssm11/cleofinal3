import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getVipSummary } from "@/lib/vip";
import { VipRing, BirthdayForm, PerkCheck } from "@/components/experience/vip";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cercle Cléopâtre" };

export default async function FidelitePage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.vip;
  const [summary] = await Promise.all([getVipSummary(me.id)]);
  const levels = t.levels;
  const currentIdx = levels.findIndex((l) => summary.lifetime >= l.at);
  const nextIdx = currentIdx + 1;
  const pct = summary.next ? Math.min(1, (summary.lifetime - summary.level.min) / Math.max(1, summary.next.min - summary.level.min)) : 1;

  return (
    <section aria-labelledby="vip-title" className="max-w-[60rem]">
      <p className="rule-label mb-4">{t.kicker}</p>
      <h1 id="vip-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {t.title}
      </h1>
      <p className="mt-4 max-w-[42rem] text-[14px] leading-[1.8] text-muted">{t.intro}</p>

      {/* Balance + ring */}
      <div className="mt-10 grid items-center gap-10 border-y border-stone/70 py-10 lg:grid-cols-[1fr_auto] lg:gap-14">
        <div>
          <p className="eyebrow mb-4">{t.balance}</p>
          <p className="font-display text-[clamp(3rem,7vw,4.6rem)] leading-none tabular-nums text-ink">
            {summary.balance.toLocaleString("fr-FR")}
            <span className="ms-3 text-[0.28em] font-bold uppercase tracking-[0.24em] text-muted-2">{t.points.replace("{n}", "").trim()}</span>
          </p>
          <p className="mt-4 text-[12.5px] text-muted">
            {t.levelLabel}{" "}
            <span className="font-display text-[15px] italic text-champagne-2">{levels[currentIdx]?.name ?? levels[0].name}</span>
            {" · "}
            {t.lifetime.replace("{n}", summary.lifetime.toLocaleString("fr-FR"))}
          </p>
          {summary.next ? (
            <p className="mt-1 text-[12.5px] text-muted">{t.toNext.replace("{n}", summary.toNext.toLocaleString("fr-FR")).replace("{level}", levels[nextIdx]?.name ?? "")}</p>
          ) : (
            <p className="mt-1 text-[12.5px] text-champagne-2">{t.maxLevel}</p>
          )}
        </div>
        <VipRing pct={pct} label={summary.next ? `${levels[currentIdx]?.name ?? ""} → ${levels[nextIdx]?.name ?? ""}` : (levels[currentIdx]?.name ?? "")} />
      </div>

      {/* Levels ladder */}
      <div className="mt-12">
        <p className="eyebrow mb-5">{t.benefits}</p>
        <ol className="grid gap-px border border-stone-2/25 bg-stone-2/20 lg:grid-cols-4">
          {levels.map((l, i) => {
            const reached = summary.lifetime >= l.at;
            return (
              <li key={l.name} className={`flex flex-col gap-3 p-5 ${reached ? "bg-cream" : "bg-paper/80"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`font-display text-[19px] leading-tight ${reached ? "text-ink" : "text-muted"}`}>
                    {String(i + 1).padStart(2, "0")} · <span className={reached ? "italic text-champagne-2" : ""}>{l.name}</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-2">{l.at.toLocaleString("fr-FR")}+</p>
                </div>
                <ul className="space-y-2">
                  {l.perks.map((p) => (
                    <li key={p} className="flex gap-2 text-[12.5px] leading-relaxed text-charcoal">
                      {reached ? <PerkCheck /> : <span aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 border border-stone-2/70" />}
                      <span className={reached ? "" : "text-muted"}>{p}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>

      {/* How it works + birthday */}
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">{t.howItWorks}</p>
          <p className="text-[13.5px] leading-[1.85] text-muted">{t.howText}</p>
          <p className="mt-3 text-[13px] italic text-champagne-2">{t.redeemHint}</p>
        </div>
        <div>
          <p className="eyebrow mb-3">{t.birthday}</p>
          <p className="mb-4 text-[13px] leading-relaxed text-muted">{t.birthdayNote.replace("{n}", "500")}</p>
          <BirthdayForm initial={me.birthDate ? new Date(me.birthDate).toISOString().slice(0, 10) : ""} />
        </div>
      </div>

      {/* Ledger */}
      <div className="mt-12">
        <p className="eyebrow mb-4">{t.history}</p>
        {summary.recent.length === 0 ? (
          <p className="border border-stone-2/45 bg-cream/60 px-5 py-6 text-center text-[13px] text-muted">{t.noHistory}</p>
        ) : (
          <ul className="divide-y divide-stone/70 border-y border-stone/70">
            {summary.recent.slice(0, 12).map((r) => (
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
