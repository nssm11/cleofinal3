import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="shell-wide">
      <div className="border-x border-line min-h-[calc(100dvh-64px)] grid lg:grid-cols-12 gap-px bg-line">
        <div className="lg:col-span-5 bg-bg p-8 lg:p-12 flex flex-col justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">01 — Accès</p>
            <h1 className="mt-6 font-sans text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[0.9] tracking-[-0.04em]">
              {t.loginTitle1}<br />
              <span className="text-text-secondary">{t.loginTitle2}</span>
            </h1>
            <p className="mt-6 max-w-[32ch] font-sans text-[14px] leading-[1.6] text-text-secondary">{t.loginKicker}</p>
          </div>
          <div className="mt-12 border-t border-line pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">CLÉOPÂTRE — Système de soin</p>
            <p className="mt-2 font-sans text-[12px] text-text-secondary">Officine dermo-cosmétique · Ezzahra · Depuis 1998</p>
          </div>
        </div>
        <div className="lg:col-span-7 bg-bg p-8 lg:p-12">
          <div className="max-w-[400px]">
            <LoginForm next={safeNext || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
