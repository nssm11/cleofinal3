"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { LogoMark } from "@/components/admin/os/icons";

/**
 * LA PAGE A CHANCÉ
 *
 * Une erreur dans la maison ne se cache pas : on la nomme, on offre de
 * retenter, et on garde la porte du poste de commande toujours à la main.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const reduce = useReducedMotion();
  const [showDigest, setShowDigest] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[46rem] flex-col items-center px-4 py-16 text-center sm:py-24">
      <AnimatePresence initial={false}>
        <motion.div
          key="card"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full border border-os-line bg-os-surface px-6 py-10 shadow-os-sheet sm:px-12"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center bg-champagne-soft text-os-gold-2 ring-1 ring-champagne-3/50">
            <LogoMark size={24} />
          </span>
          <h1 className="mt-5 font-display text-[1.7rem] leading-tight tracking-tight text-os-text">La page a changé d&apos;avis.</h1>
          <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] leading-relaxed text-os-muted">
            Une difficulté s&apos;est glissée dans cette pièce. Le reste de la maison est debout — on peut retenter, ou retourner au poste de commande.
          </p>
          {showDigest && error.digest && (
            <pre className="mt-4 max-h-36 overflow-auto border border-os-line-soft bg-os-surface-2 p-3 text-left font-mono text-[11px] text-os-muted" role="log">
              {error.message || "erreur sans détail"}
              {"\n"}digest : {error.digest}
            </pre>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-os-ink px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-os-onink transition-colors hover:bg-os-ink-2"
            >
              Retenter
            </button>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-os-line px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-os-text transition-colors hover:border-os-line-strong hover:bg-os-surface-2"
            >
              Poste de commande
            </Link>
          </div>
          {error.digest && (
            <button
              onClick={() => setShowDigest((s) => !s)}
              className="mt-5 text-[10.5px] uppercase tracking-[0.14em] text-os-faint transition-colors hover:text-os-muted"
            >
              {showDigest ? "Masquer le détail technique" : "Détail technique"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
