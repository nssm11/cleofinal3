"use client";
import { useState } from "react";
import { OsButton } from "./primitives";

export function OrderWizard({ paymentMethods, shippingFees, freeShippingThreshold }: { paymentMethods: { key: string; label: string }[]; shippingFees: { standard: number; express: number }; freeShippingThreshold: number }) {
  const [step, setStep] = useState(0);
  return (
    <div className="border border-line bg-bg p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Nouvelle commande — étape {step + 1}</p>
      <div className="mt-4 h-[2px] w-full bg-line"><div className="h-full bg-ink" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      <div className="mt-6 flex gap-2">
        <OsButton size="sm" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>Retour</OsButton>
        <OsButton size="sm" variant="primary" onClick={() => setStep((s) => Math.min(2, s + 1))}>Suivant</OsButton>
      </div>
    </div>
  );
}
