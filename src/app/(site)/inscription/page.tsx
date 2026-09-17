import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { RegisterForm } from "@/components/account/auth-forms";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="shell-wide">
      <div className="border-x border-line min-h-[calc(100dvh-64px)] grid lg:grid-cols-12 gap-px bg-line">
        <div className="lg:col-span-5 bg-bg p-8 lg:p-12 flex flex-col justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">02 — Inscription</p>
            <h1 className="mt-6 font-sans text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[0.9] tracking-[-0.04em]">{t.registerTitle1}<br /><span className="text-text-secondary">{t.registerTitle2}</span></h1>
            <p className="mt-6 max-w-[32ch] font-sans text-[14px] leading-[1.6] text-text-secondary">{t.registerKicker}</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-6">
            {t.facts.map(([n, l]) => <div key={l}><p className="font-sans text-[18px] font-semibold">{n}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{l}</p></div>)}
          </div>
        </div>
        <div className="lg:col-span-7 bg-bg p-8 lg:p-12">
          <div className="max-w-[440px]"><RegisterForm next={safeNext || undefined} /></div>
        </div>
      </div>
    </div>
  );
}
