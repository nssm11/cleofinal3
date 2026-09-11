"use client";
import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { advisorQuizAction, type AdvisorResult } from "@/actions/shop";
import { ADVISOR_QUESTIONS } from "@/lib/advisor-questions";
import { formatDT } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * LE DIAGNOSTIC — quatre questions, une à la fois.
 *
 * Une question par écran plutôt qu'un long formulaire : on répond plus
 * honnêtement à une question qu'à quatre, et le conseil n'est bon que si les
 * réponses le sont. La progression est matérialisée par un filet — on sait
 * toujours combien il reste, ce qui est la première raison d'abandonner un quiz.
 *
 * Le calcul, lui, reste côté serveur : le navigateur n'envoie que les quatre
 * réponses. Les pondérations ne sont ni devinables ni modifiables depuis ici.
 */
export function AdvisorQuiz({ isAuthed }: { isAuthed: boolean }) {
  const [state, action, pending] = useActionState<AdvisorResult | null, FormData>(advisorQuizAction, null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const reduce = useReducedMotion();

  const question = ADVISOR_QUESTIONS[step];
  const done = step >= ADVISOR_QUESTIONS.length;
  const total = ADVISOR_QUESTIONS.length;

  function choose(value: string) {
    setAnswers((a) => ({ ...a, [question.id]: value }));
    // Un léger temps de lecture avant de passer : la sélection doit se voir.
    setTimeout(() => setStep((s) => s + 1), reduce ? 0 : 180);
  }

  /** Le résultat vient de l'action ; sans elle, rien à afficher. */
  if (state?.ok && state.picks) {
    const picks = state.picks;
    return (
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D.base, ease: EASE_LUXE }}>
        <p className="eyebrow flex items-center gap-2 text-champagne-2">
          <SparkIcon size={14} /> Votre conseil
          {state.saved && <span className="ml-2 text-muted normal-case tracking-normal">— enregistré dans votre espace</span>}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.08] tracking-[-0.02em] text-ink">
          {picks.length > 0 ? "Ce que nous vous conseillons" : "Rien de parfait en stock"}
        </h2>

        {state.rationale && state.rationale.length > 0 && (
          <ul className="mt-5 max-w-2xl space-y-2 border-l border-champagne pl-5">
            {state.rationale.map((r) => (
              <li key={r} className="text-[13.5px] leading-relaxed text-charcoal">
                {r}
              </li>
            ))}
          </ul>
        )}

        {picks.length === 0 ? (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
            {state.message ?? "Aucune référence disponible ne correspond exactement."}{" "}
            <a href="tel:+21671450210" className="text-ink underline underline-offset-4">
              71 450 210
            </a>
          </p>
        ) : (
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.55, ease: EASE_LUXE }}
              >
                <Link href={`/produit/${p.slug}`} className="group block border border-stone bg-cream/50 transition-colors hover:border-champagne">
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    )}
                    <span className="absolute left-0 top-0 bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper">
                      {i + 1}
                    </span>
                  </div>
                  <div className="p-4">
                    {p.brandName && <p className="eyebrow text-muted">{p.brandName}</p>}
                    <p className="mt-1 font-display text-[17px] leading-snug text-ink">{p.name}</p>
                    {p.volume && <p className="mt-0.5 text-[12px] text-muted-2">{p.volume}</p>}
                    <p className="mt-2 text-[13.5px] tabular-nums text-champagne-2">{formatDT(p.priceMillimes)}</p>
                    {p.matched.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1">
                        {p.matched.slice(0, 2).map((m) => (
                          <span key={m} className="border border-stone-2/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                            {m}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.li>
            ))}
          </ol>
        )}

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setAnswers({});
              setStep(0);
            }}
            className="btn-ghost"
          >
            Refaire le diagnostic
          </button>
          {!isAuthed && (
            <Link href="/connexion?next=/conseil" className="btn-secondary">
              S&apos;identifier pour l&apos;enregistrer
            </Link>
          )}
          {isAuthed && <Link href="/compte/diagnostic" className="btn-secondary">Voir dans mon espace</Link>}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── Le filet de progression ─────────────────────────────────────── */}
      <div className="flex items-center gap-2" aria-hidden>
        {ADVISOR_QUESTIONS.map((_, i) => (
          <span key={i} className={cn("h-px flex-1 transition-colors duration-500", i < step ? "bg-ink" : "bg-stone-2")} />
        ))}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-2">
        Question {Math.min(step + 1, total)} sur {total}
      </p>

      <form action={action} className="mt-8">
        {ADVISOR_QUESTIONS.map((q) => (
          <input key={q.id} type="hidden" name={q.id} value={answers[q.id] ?? ""} />
        ))}

        {done ? (
          <div className="border border-stone bg-cream p-8 text-center">
            <CheckIcon size={22} className="mx-auto text-champagne-2" />
            <p className="mt-4 font-display text-[22px] text-ink">C&apos;est tout ce qu&apos;il nous fallait.</p>
            <p className="mt-2 text-sm text-muted">
              Nous croisons vos réponses avec les références réellement disponibles.
            </p>
            <button type="submit" disabled={pending} className="btn-primary mx-auto mt-6">
              {pending ? "Calcul du conseil…" : "Voir mon conseil"}
            </button>
            {state && !state.ok && (
              <p className="mt-4 text-sm text-error" role="alert">
                {state.error}
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.fieldset
              key={question.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: D.base, ease: EASE_LUXE }}
              className="space-y-5"
            >
              <legend className="w-full">
                <span className="font-display text-[clamp(1.5rem,3vw,2.1rem)] leading-tight tracking-[-0.02em] text-ink">
                  {question.ask}
                </span>
                {question.hint && <span className="mt-2 block text-[13px] text-muted">{question.hint}</span>}
              </legend>

              <div className="grid gap-2.5">
                {question.options.map((o) => {
                  const on = answers[question.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => choose(o.value)}
                      aria-pressed={on}
                      className={cn(
                        "flex min-h-[52px] items-center gap-3 border px-4 py-3 text-left transition-colors duration-300",
                        on ? "border-ink bg-cream" : "border-stone bg-transparent hover:border-champagne",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                          on ? "border-ink bg-ink text-paper" : "border-stone-2",
                        )}
                      >
                        {on && <CheckIcon size={10} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14.5px] text-ink">{o.label}</span>
                        {o.detail && <span className="mt-0.5 block text-[12px] text-muted">{o.detail}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                >
                  <ArrowLeftIcon size={13} /> Question précédente
                </button>
              )}
            </motion.fieldset>
          </AnimatePresence>
        )}

        {done && !pending && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-2">
            <ArrowRightIcon size={12} /> Un conseil de pharmacien, pas une liste de promotions
          </p>
        )}
      </form>
    </div>
  );
}
