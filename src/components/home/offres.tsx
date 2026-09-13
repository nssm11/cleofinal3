"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import { useToast } from "@/components/ui/toaster";
import type { ProductCard as PC } from "@/lib/catalog";
import { discountPercent, formatDT, formatDTShort } from "@/lib/money";

/**
 * HM · LES CHIFFRES — offers with no cards at all.
 *
 * The band and the night are both gone. What remains is typography: marked
 * references run as a hairline index — number, name, honest percent, price —
 * and the promo codes sit beside them in a quiet panel, still tap-to-copy.
 * Commerce reduced to its ledger. Small, sharp, and final.
 */

function CodeRow({
  code, label, min, from,
}: {
  code: string; label: string; min: number; from: string;
}) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable — the toast still hands the code back */
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1600);
    toast({ kind: "success", title: code });
  };

  return (
    <button
      type="button"
      onClick={copyCode}
      aria-live="polite"
      className="group flex w-full items-center justify-between gap-4 border border-dashed border-ink/25 bg-paper px-4 py-3 text-left transition-colors duration-300 hover:border-champagne-2"
    >
      <span className="min-w-0">
        <code className="block truncate font-display text-[18px] tracking-[0.05em] text-ink">{code}</code>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {min > 0 && (
          <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-2">
            {from} {formatDTShort(min)}
          </span>
        )}
        <span className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${done ? "border-champagne-2 bg-champagne-2 text-paper" : "border-ink/20 text-muted group-hover:border-champagne-2 group-hover:text-champagne-2"}`}>
          {done ? (
            <CheckIcon size={13} />
          ) : (
            <span aria-hidden className="relative block h-3 w-3">
              <span className="absolute left-0 top-0 block h-2 w-2 border border-current" />
              <span className="absolute bottom-0 right-0 block h-2 w-2 bg-current opacity-50" />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export function Offres({
  promos,
  codes,
  copy,
}: {
  promos: PC[];
  codes: { id: number; code: string; label: string; minSubtotalMillimes: number }[];
  copy: {
    eyebrow: string;
    title1: string;
    title2: string;
    text: string;
    from: string;
    cta: string;
  };
}) {
  if (promos.length === 0 && codes.length === 0) return null;
  const lines = promos.slice(0, 4);

  return (
    <section aria-label={copy.eyebrow} className="relative">
      <div className="container-wide py-14 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <p className="hm-kicker text-muted">{copy.eyebrow}</p>
                <h2 className="hm-display mt-3 text-[clamp(1.7rem,3.2vw,2.5rem)] text-ink">
                  {copy.title1} <span className="italic text-champagne-2">{copy.title2}</span>
                </h2>
              </div>
              <Link href="/promotions" className="btn-ghost !min-h-11 shrink-0">
                {copy.cta} <ArrowRightIcon size={13} className="rtl-mirror" />
              </Link>
            </div>
          </Reveal>

          <div className={`mt-8 grid gap-10 ${lines.length > 0 && codes.length > 0 ? "lg:grid-cols-12" : ""}`}>
            {lines.length > 0 && (
              <Reveal className={codes.length > 0 ? "lg:col-span-7" : ""}>
                <ul className="border-t border-stone/70">
                  {lines.map((p, i) => {
                    const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
                    return (
                      <li key={p.id} className="border-b border-stone/70">
                        <Link href={`/produit/${p.slug}`} className="group flex items-center gap-4 py-4 sm:gap-5">
                          <span className="w-7 shrink-0 font-display text-[13px] italic text-muted-2">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-marble">
                            {p.image && (
                              <Image
                                src={p.image}
                                alt=""
                                fill
                                sizes="56px"
                                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.22em] text-muted-2">
                              {p.brandName}
                            </span>
                            <span className="mt-1 block truncate font-display text-[19px] leading-snug text-ink transition-colors duration-300 group-hover:text-champagne-2">
                              {p.name}
                            </span>
                          </span>
                          {pct > 0 && (
                            <span className="shrink-0 bg-ink px-2 py-1 text-[10px] font-bold tabular-nums tracking-[0.06em] text-paper">
                              −{pct}%
                            </span>
                          )}
                          <span className="shrink-0 text-right">
                            <span className="block text-[15px] tabular-nums text-ink">{formatDT(p.priceMillimes)}</span>
                            {pct > 0 && p.compareAtMillimes && (
                              <span className="block text-[11px] tabular-nums text-muted-2 line-through">
                                {formatDT(p.compareAtMillimes)}
                              </span>
                            )}
                          </span>
                          <ArrowRightIcon size={16} className="shrink-0 text-sand-2 transition-all duration-300 group-hover:translate-x-1 group-hover:text-champagne-2 rtl-mirror" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            )}

            {codes.length > 0 && (
              <Reveal delay={0.08} className={lines.length > 0 ? "lg:col-span-5" : ""}>
                <div className="border border-stone/70 bg-cream/50 p-5 sm:p-6">
                  <p className="text-[13px] leading-relaxed text-muted">{copy.text}</p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {codes.map((c) => (
                      <li key={c.id}>
                        <CodeRow code={c.code} label={c.label} min={c.minSubtotalMillimes} from={copy.from} />
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
