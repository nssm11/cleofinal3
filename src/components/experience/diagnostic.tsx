"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { formatDT } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import { getRecommendationsAction, saveDiagnosticAction } from "@/actions/experience";

/**
 * LE DIAGNOSTIC — five questions, one shelf.
 *
 * The flow is a single column of hairline choices, one question at a time,
 * advancing like a page turning. Results arrive with the pharmacist's reason
 * under each product; the whole selection can go to the plateau or become a
 * ritual in one move. Saved to the account when you are signed in — kept in
 * memory for the visit when you are not.
 */

export type QuizAnswers = Record<string, string | undefined>;
export type ResultProduct = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  shortDescription: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  image: string | null;
  stock: number;
  volume: string | null;
  why: string;
};

type Option = { v: string; l: string; d: string };

export function Diagnostic({ questions, isAuthed }: { questions: { key: string; label: string; options: Option[] }[]; isAuthed: boolean }) {
  const copy = useCopy();
  const t = copy.quiz;
  const reduce = useReducedMotion();
  const cart = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState(-1); // -1 = opening
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [results, setResults] = useState<ResultProduct[] | null>(null);
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const total = questions.length;
  const current = questions[step];

  const choose = (key: string, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < total - 1) {
      setTimeout(() => setStep((s) => s + 1), 220);
    } else {
      compute(next);
    }
  };

  const compute = (a: QuizAnswers) => {
    start(async () => {
      const r = await getRecommendationsAction(a);
      if (r.ok) {
        setResults(r.data);
        setStep(total); // results
        requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
      }
    });
  };

  const save = () => {
    if (!isAuthed || !results) return;
    start(async () => {
      await saveDiagnosticAction({ answers, productIds: results.map((r) => r.id) });
      toast({ kind: "success", title: t.savedResult });
    });
  };

  const addAll = (ref: HTMLElement | null) => {
    if (!results) return;
    results.forEach((p) =>
      cart.add(
        { productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume },
        1,
        ref,
      ),
    );
    toast({ kind: "success", title: t.addAll, action: { label: copy.common.viewAll, onClick: cart.open } });
  };

  return (
    <div ref={scrollRef} className="mx-auto w-full max-w-[46rem]">
      <AnimatePresence mode="wait">
        {/* ── Opening ─────────────────────────────────────────────────── */}
        {step === -1 && (
          <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: reduce ? 0 : -12 }} transition={{ duration: D.fast, ease: EASE_LUXE }}>
            <p className="rule-label mb-8">{t.kicker}</p>
            <h1 className="font-display text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[0.98] tracking-[-0.024em] text-ink">
              {t.intro1} <em className="text-champagne-2">{t.intro2}</em>
            </h1>
            <p className="mt-7 max-w-[36rem] text-[15px] leading-[1.85] text-muted">{t.introText}</p>
            <ul className="mt-10 grid gap-px border border-stone-2/30 bg-stone-2/25 sm:grid-cols-3">
              {[
                [total, "questions"],
                ["5", copy.common.minutes],
                ["6", copy.common.products],
              ].map(([n, l]) => (
                <li key={l as string} className="bg-paper px-5 py-5 text-center">
                  <p className="font-display text-[30px] leading-none text-ink">{n}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">{l}</p>
                </li>
              ))}
            </ul>
            <button onClick={() => setStep(0)} className="btn-primary mt-10 w-full sm:w-auto">
              {t.start} <ArrowRightIcon size={13} className="rtl-mirror" />
            </button>
          </motion.div>
        )}

        {/* ── A question ──────────────────────────────────────────────── */}
        {step >= 0 && step < total && current && (
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: reduce ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -24 }}
            transition={{ duration: D.fast, ease: EASE_LUXE }}
            className="py-2"
          >
            <div className="mb-9 flex items-baseline justify-between gap-6">
              <p className="eyebrow">
                {t.questionOf.replace("{n}", String(step + 1)).replace("{total}", String(total))}
              </p>
              <div className="flex items-center gap-1.5" aria-hidden>
                {questions.map((q, i) => (
                  <span key={q.key} className={`h-px w-6 transition-colors duration-500 ${i < step ? "bg-champagne" : i === step ? "bg-ink" : "bg-stone-2/60"}`} />
                ))}
              </div>
            </div>
            <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.3rem)] leading-[1.1] tracking-[-0.02em] text-ink">{current.label}</h2>
            <ul className="mt-8 space-y-3">
              {current.options.map((o) => {
                const selected = answers[current.key] === o.v;
                return (
                  <li key={o.v}>
                    <button
                      onClick={() => choose(current.key, o.v)}
                      className={`group relative flex w-full items-center gap-5 border px-5 py-4 text-start transition-colors duration-300 ${
                        selected ? "border-champagne bg-cream" : "border-stone-2/45 bg-transparent hover:border-ink/60 hover:bg-cream/60"
                      }`}
                      aria-pressed={selected}
                    >
                      <span
                        aria-hidden
                        className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${selected ? "border-champagne-2 bg-champagne-2 text-paper" : "border-stone-2/70"}`}
                      >
                        {selected && <CheckIcon size={11} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[18px] leading-snug text-ink">{o.l}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{o.d}</span>
                      </span>
                      <ArrowRightIcon size={14} className="ms-auto shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1 group-hover:text-ink rtl-mirror" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => (step === 0 ? setStep(-1) : setStep(step - 1))} className="btn-ghost min-h-10">
                {copy.common.back}
              </button>
              {step < total - 1 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2 underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {t.skip}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {step >= total && (
          <motion.div key="results" initial={{ opacity: 0, y: reduce ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D.base, ease: EASE_LUXE }}>
            <p className="rule-label mb-5">{copy.header.diagnostic}</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.04] tracking-[-0.02em] text-ink">{t.resultsTitle}</h2>
            <p className="mt-5 max-w-[40rem] text-[14.5px] leading-[1.85] text-muted">
              {t.resultsIntro} {results && (t.results as unknown as Record<string, string>)?.[answers.skin ?? ""]}
            </p>

            <ul className="mt-10 space-y-5">
              {(results ?? []).map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.07, duration: D.base, ease: EASE_LUXE }}
                  className="group grid grid-cols-[104px_1fr] gap-5 border border-stone-2/35 bg-paper/70 p-4 transition-colors duration-500 hover:border-champagne/60 sm:grid-cols-[124px_1fr] sm:p-5"
                >
                  <Link href={`/produit/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-marble">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width:640px) 104px, 124px"
                        className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                      />
                    )}
                    {i === 0 && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 bg-champagne-3 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-noir">
                        <SparkIcon size={9} /> 01
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-2">{p.brandName}</p>
                    <Link href={`/produit/${p.slug}`} className="mt-1 block font-display text-[19px] leading-snug text-ink transition-colors hover:text-champagne-2">
                      {p.name}
                    </Link>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{p.shortDescription}</p>
                    <p className="mt-3 border-t border-stone/70 pt-2.5 text-[12px] italic leading-relaxed text-champagne-2">
                      <span className="mr-1.5 font-body text-[9px] font-bold uppercase not-italic tracking-[0.2em] text-muted-2">{t.why} —</span>
                      {p.why}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="text-[14px] tabular-nums text-ink">{formatDT(p.priceMillimes)}</span>
                      {p.compareAtMillimes && <span className="text-[11px] text-muted-2 line-through">{formatDT(p.compareAtMillimes)}</span>}
                      <button
                        onClick={(e) =>
                          cart.add(
                            { productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume },
                            1,
                            (e.currentTarget.closest("li") as HTMLElement) ?? null,
                          )
                        }
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink underline decoration-champagne-2 decoration-1 underline-offset-4 transition-colors hover:text-champagne-2"
                      >
                        {copy.product.add}
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
              {!results && (
                <li className="border border-stone-2/35 bg-cream/60 px-6 py-10 text-center text-[13px] text-muted">
                  {pending ? t.computing : t.resultsIntro}
                </li>
              )}
            </ul>

            {results && results.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone/70 pt-7">
                <button onClick={() => addAll(scrollRef.current)} className="btn-primary">
                  {t.addAll}
                </button>
                {isAuthed ? (
                  <>
                    <Link href={`/compte/rituels?from=diagnostic`} className="btn-secondary">
                      {t.buildRitual}
                    </Link>
                    <button onClick={save} disabled={pending} className="btn-ghost min-h-10">
                      {t.saveResult}
                    </button>
                  </>
                ) : (
                  <Link href="/inscription" className="btn-ghost min-h-10">
                    {t.loginToSave}
                  </Link>
                )}
                <button onClick={() => { setStep(0); setResults(null); }} className="ms-auto text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2 underline-offset-4 hover:text-ink hover:underline">
                  {t.again}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
