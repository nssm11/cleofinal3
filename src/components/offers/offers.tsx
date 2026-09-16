"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { CheckIcon, TagIcon } from "@/components/icons";
import { formatDTShort } from "@/lib/money";

/* ══════════════════════════════════════════════════════════════════════════
   OFFERS — the campaign's own instruments.

   OfferCountdown speaks the DaisyUI countdown architecture (the `--value`
   spans, aria-live) with the maison's materials: fluid tabular digits in
   cells that wrap instead of overflowing. OfferCard composes the code, its
   exact conditions, a copy gesture and the live clock into one card.
   Everything is data-driven — nothing here invents an offer.
   ══════════════════════════════════════════════════════════════════════════ */

export type Offer = {
  id: number;
  code: string;
  label: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotalMillimes: number;
  endsAt: Date | string | null;
};

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    sec: s % 60,
  };
}

/** The offer's own clock — DaisyUI countdown markup, ticking every second. */
export function OfferCountdown({
  endsAt,
  dark = false,
  className,
}: {
  endsAt: Date | string;
  dark?: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = parts(target - (now ?? target));
  const urgent = target - (now ?? target) < 24 * 3600 * 1000;
  const L =
    locale === "tn-arab"
      ? { d: "يوم", h: "ساعة", m: "دقيقة", s: "ثانية" }
      : locale === "tn"
        ? { d: "jours", h: "heures", m: "min", s: "sec" }
        : { d: "jours", h: "heures", m: "min", s: "sec" };
  const cells: { v: number; l: string }[] = [
    { v: p.days, l: L.d },
    { v: p.hours, l: L.h },
    { v: p.min, l: L.m },
    { v: p.sec, l: L.s },
  ];
  return (
    <div
      className={cn("countdown-row", dark && "countdown-dark", urgent && now !== null && "countdown-urgent", className)}
      role="timer"
      aria-label={locale === "tn-arab" ? "الوقت المتبقي" : "Temps restant"}
    >
      {cells.map((c, i) => (
        <div key={c.l} className="countdown-cell">
          <span className="countdown">
            {/* The DaisyUI `--value` span; digits are real text so the clock
                stays truthful for assistive tech and for every locale. */}
            <span style={{ "--value": c.v } as React.CSSProperties} aria-live={i === 3 ? "polite" : undefined}>
              {String(c.v).padStart(2, "0")}
            </span>
          </span>
          <span className="countdown-label">{c.l}</span>
        </div>
      ))}
    </div>
  );
}

function valueLine(o: Offer): string {
  if (o.type === "percent") return `−${o.value} %`;
  if (o.type === "fixed") return `−${formatDTShort(o.value)}`;
  return "Livraison offerte";
}

/** One written commitment: the code large, its conditions beneath, the clock live. */
export function OfferCard({ offer, dark = false, index = 0 }: { offer: Offer; dark?: boolean; index?: number }) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the code stays selectable */
    }
  };
  const endsLabel =
    offer.endsAt != null
      ? locale === "tn-arab"
        ? `حتى ${new Intl.DateTimeFormat("ar-TN", { day: "numeric", month: "long" }).format(new Date(offer.endsAt))}`
        : `Jusqu'au ${new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "long" }).format(new Date(offer.endsAt))}`
      : locale === "tn-arab"
        ? "عرض دائم"
        : "Offre permanente";
  const minLabel =
    offer.minSubtotalMillimes > 0
      ? locale === "tn-arab"
        ? `ابتداءً من ${formatDTShort(offer.minSubtotalMillimes)}`
        : `Dès ${formatDTShort(offer.minSubtotalMillimes)}`
      : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[3px] border p-6 sm:p-7",
        dark
          ? "border-paper/15 bg-paper/[0.04] backdrop-blur-sm"
          : "border-stone/60 bg-ivory shadow-whisper transition-[box-shadow,border-color] duration-500 hover:border-stone-2/70 hover:shadow-soft",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-champagne-3 to-transparent opacity-70"
      />
      <div className="flex items-start justify-between gap-4">
        <p className={cn("font-display text-[13px] italic", dark ? "text-champagne-3/70" : "text-champagne-2/80")}>
          {String(index + 1).padStart(2, "0")}
        </p>
        <span className={cn("badge", dark ? "badge-champagne" : "badge-gold")}>
          <TagIcon size={11} aria-hidden /> {valueLine(offer)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code
          className={cn(
            "font-display text-[clamp(1.5rem,4vw,2rem)] tracking-[0.04em]",
            dark ? "text-champagne-3" : "text-ink",
          )}
        >
          {offer.code}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 border px-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300",
            dark
              ? "border-paper/25 text-paper/80 hover:border-champagne-3 hover:text-champagne-3"
              : "border-stone/70 text-muted hover:border-champagne-2 hover:text-champagne-2",
          )}
        >
          {copied ? <CheckIcon size={12} aria-hidden /> : null}
          {copied ? (locale === "tn-arab" ? "تم النسخ" : "Copié") : locale === "tn-arab" ? "نسخ" : "Copier"}
        </button>
      </div>

      <p className={cn("mt-3 text-[13.5px] leading-relaxed", dark ? "text-paper/70" : "text-muted")}>{offer.label}</p>
      <p
        className={cn(
          "mt-2 text-[10px] font-bold uppercase tracking-[0.18em]",
          dark ? "text-paper/45" : "text-muted-2",
        )}
      >
        {minLabel ? <>{minLabel} · </> : null}
        {endsLabel}
      </p>

      {offer.endsAt != null && (
        <div className="mt-6 border-t border-dashed pt-5 [border-color:color-mix(in_oklab,currentColor_15%,transparent)]">
          <OfferCountdown endsAt={offer.endsAt} dark={dark} />
        </div>
      )}
    </article>
  );
}

/** The campaign wall — 1 column on the phone, 2 on the laptop, 3 on the wide. */
export function OfferGrid({ offers, dark = false }: { offers: Offer[]; dark?: boolean }) {
  if (offers.length === 0) return null;
  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {offers.map((o, i) => (
        <OfferCard key={o.id} offer={o} dark={dark} index={i} />
      ))}
    </div>
  );
}
