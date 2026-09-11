"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, PackageIcon } from "@/components/icons";
import { ORDER_FLOW, ORDER_STEPS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { EASE_LUXE } from "@/lib/motion";

/**
 * LE FIL DE LA COMMANDE — sept statuts, un récit.
 *
 * Trois couches plutôt qu'une :
 *   1. la progression, cinq étapes — où en suis-je, d'un coup d'œil ;
 *   2. l'étape courante développée — que se passe-t-il, et qu'est-ce que
 *      j'attends ensuite, dans ses propres mots ;
 *   3. le journal horodaté — la preuve, pour qui veut vérifier.
 *
 * Les deux issues hors parcours (annulée, retournée) ne sont pas masquées :
 * elles ont leur propre panneau et leur propre texte de remboursement, parce
 * que c'est précisément là qu'une cliente a le plus besoin de lire.
 *
 * Et partout, une seule porte de sortie quand quelque chose cloche :
 * « J'ai un problème », qui ouvre un ticket déjà rempli du numéro de commande.
 */
export function OrderTimeline({
  status,
  events,
  orderNumber,
  trackingCode,
  carrierHref,
}: {
  status: OrderStatus;
  events: { status: OrderStatus; message: string | null; createdAt: Date | string }[];
  orderNumber?: string;
  trackingCode?: string | null;
  carrierHref?: string | null;
}) {
  const reduce = useReducedMotion();
  const step = ORDER_STEPS[status];
  const terminal = !!step.terminal;
  const idx = terminal ? -1 : ORDER_FLOW.indexOf(status);

  /** Une demande déjà remplie : la cliente n'a pas à retrouver son numéro. */
  const problemHref = `/aide?demande=commande${orderNumber ? `&commande=${encodeURIComponent(orderNumber)}` : ""}&sujet=${encodeURIComponent(
    orderNumber ? `Problème avec ma commande ${orderNumber}` : "Problème avec ma commande",
  )}`;

  return (
    <div>
      {/* ── 1 · La progression ───────────────────────────────────────────── */}
      <ol className="grid grid-cols-5 gap-1" aria-label="Progression de la commande">
        {ORDER_FLOW.map((s, i) => {
          const done = !terminal && i < idx;
          const now = !terminal && i === idx;
          return (
            <li key={s} className="flex flex-col items-center text-center">
              <motion.span
                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: EASE_LUXE }}
                aria-current={now ? "step" : undefined}
                className={[
                  "flex h-8 w-8 items-center justify-center border transition-colors",
                  done || now ? "border-ink bg-ink text-paper" : "border-stone-2 text-muted-2",
                  now && !reduce ? "ring-1 ring-champagne ring-offset-2 ring-offset-paper" : "",
                ].join(" ")}
              >
                {done ? <CheckIcon size={14} /> : <span className="text-[11px]">{i + 1}</span>}
              </motion.span>
              <span className={`mt-2 text-[10px] uppercase tracking-[0.12em] ${done || now ? "text-ink" : "text-muted-2"}`}>
                {ORDER_STEPS[s].label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* ── 2 · L'étape courante, racontée ───────────────────────────────── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: EASE_LUXE }}
        className={`mt-8 border-l-2 p-5 sm:p-6 ${terminal ? "border-error bg-error-soft/40" : "border-champagne bg-cream"}`}
        role="status"
      >
        <p className={`eyebrow mb-2 ${terminal ? "text-error" : "text-champagne-2"}`}>
          {terminal ? "Issue du parcours" : `Étape ${idx + 1} sur ${ORDER_FLOW.length}`}
        </p>
        <p className="font-display text-[clamp(1.25rem,2.4vw,1.6rem)] leading-tight text-ink">{step.title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal">{step.description}</p>
        <p className="mt-3 flex gap-2 text-sm text-muted">
          <span aria-hidden className="mt-2 h-px w-5 shrink-0 bg-champagne" />
          {step.next}
        </p>

        {status === "shipped" && trackingCode && (
          <p className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone pt-4 text-sm">
            <PackageIcon size={15} className="text-champagne-2" />
            <span className="text-muted">Suivi transporteur :</span>
            <code className="bg-paper px-2 py-0.5 font-mono text-[13px] text-ink">{trackingCode}</code>
            {carrierHref && (
              <a
                href={carrierHref}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink underline underline-offset-4 hover:text-champagne-2"
              >
                Suivre chez le transporteur
              </a>
            )}
          </p>
        )}
      </motion.div>

      {/* ── 3 · Le journal ───────────────────────────────────────────────── */}
      {events.length > 0 && (
        <details className="mt-8 group" open={!terminal}>
          <summary className="eyebrow cursor-pointer select-none text-muted transition-colors hover:text-ink">
            Historique détaillé ({events.length})
          </summary>
          <ul className="mt-5 space-y-4 border-l border-stone pl-5">
            {events.map((e, i) => (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: EASE_LUXE }}
                className="relative text-sm"
              >
                <span className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 bg-champagne" />
                <p className="text-ink">
                  {ORDER_STEPS[e.status].label}
                  {e.message ? <span className="text-muted"> — {e.message}</span> : null}
                </p>
                <p className="text-xs text-muted-2">{formatDateTime(e.createdAt)}</p>
              </motion.li>
            ))}
          </ul>
        </details>
      )}

      {/* ── 4 · La porte de sortie ───────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone pt-6">
        <p className="max-w-md text-sm text-muted">
          Un article manquant, un colis qui tarde, un doute&nbsp;? Un pharmacien vous répond — pas un formulaire sans suite.
        </p>
        <Link href={problemHref} className="btn-secondary ml-auto whitespace-nowrap">
          J&apos;ai un problème
        </Link>
      </div>
    </div>
  );
}
