"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Pulse } from "@/lib/live";
import { EASE } from "@/components/kit/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LA PREUVE VIVANTE — the shop, heard from the street.

   Two things, both true:

   · LES CHIFFRES — references on the shelf, orders this week, cities
     delivered to. They arrived with the page (server-rendered, so they are
     there without JavaScript) and they move when the stream says they moved.

   · LE MOT — a single line when something actually happens: a parcel that
     left for a city. One at a time, six seconds, dismissible, silent under
     reduced motion. It is the difference between a shop and a brochure.

   Nothing here invents activity. If no order has gone out, no toast appears;
   the counters simply read what the database counts.
   ══════════════════════════════════════════════════════════════════════════ */

function ago(minutes: number): string {
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${Math.round(minutes)} min`;
  if (minutes < 60 * 24) return `il y a ${Math.round(minutes / 60)} h`;
  const days = Math.round(minutes / (60 * 24));
  return days === 1 ? "hier" : `il y a ${days} jours`;
}

/** A figure that flinches in ink when it changes, then settles. */
function Figure({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(value);
  const [moved, setMoved] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setMoved(true);
    const tick = window.setTimeout(() => setShown(value), 180);
    const settle = window.setTimeout(() => setMoved(false), 900);
    return () => {
      window.clearTimeout(tick);
      window.clearTimeout(settle);
    };
  }, [value]);

  return (
    <div className="border-l border-line px-4 first:border-l-0 first:pl-0">
      <p
        className="font-display text-[clamp(1.5rem,3vw,2.1rem)] leading-none tabular-nums text-carbon transition-colors duration-500"
        style={{ color: moved ? "var(--color-iodine)" : undefined }}
      >
        {shown}
      </p>
      <p className="kicker-xs mt-1.5 text-faint">{label}</p>
    </div>
  );
}

export function LiveProof({ initial }: { initial: Pulse }) {
  const [pulse, setPulse] = useState(initial);
  const [toast, setToast] = useState<{ city: string; minutes: number; key: string } | null>(null);
  const reduce = useReducedMotion();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/live");
    source.addEventListener("pulse", (event) => {
      let next: Pulse;
      try {
        next = JSON.parse((event as MessageEvent).data) as Pulse;
      } catch {
        return;
      }
      if (typeof next.references !== "number") return;
      setPulse(next);

      // A toast only when the most recent order is genuinely new — and never
      // for the one that was already on the page when it loaded.
      if (!next.last?.city) return;
      const key = `${next.last.city}:${Math.round(next.last.minutesAgo)}`;
      if (seen.current === null) {
        seen.current = key;
        return;
      }
      if (seen.current !== key && next.last.minutesAgo < 30) {
        seen.current = key;
        setToast({ city: next.last.city, minutes: next.last.minutesAgo, key });
      }
    });
    return () => source.close();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      <div className="flex flex-wrap items-end gap-y-6 border-y border-line py-6">
        <Figure value={pulse.references} label="Références au comptoir" />
        <Figure value={pulse.ordersWeek} label="Commandes cette semaine" />
        <Figure value={pulse.cities} label="Villes livrées" />
        <Figure value={pulse.views} label="Conseils consultés (7 j)" />
        <div className="ms-auto max-w-[26ch] text-[12.5px] leading-relaxed text-muted">
          {pulse.last?.city ? (
            <>
              Dernière commande partie pour <span className="text-carbon">{pulse.last.city}</span>, {ago(pulse.last.minutesAgo)}.
            </>
          ) : (
            <>Les chiffres viennent de la caisse, pas d&apos;un décor.</>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.key}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="pointer-events-auto fixed bottom-6 left-6 z-40 max-w-[19rem] border border-line bg-porcelain p-4 shadow-sheet"
            role="status"
            aria-live="polite"
          >
            <button
              onClick={() => setToast(null)}
              className="absolute right-2 top-2 px-1.5 text-[11px] text-faint transition-colors hover:text-carbon"
              aria-label="Fermer"
            >
              ✕
            </button>
            <p className="kicker-xs flex items-center gap-2 text-faint">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-iodine" />
              La maison
            </p>
            <p className="mt-2 text-[13px] leading-snug text-carbon">
              Une commande vient de partir pour <span className="font-medium">{toast.city}</span>.
            </p>
            <p className="mt-1 text-[11px] text-faint">{ago(toast.minutes)}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
