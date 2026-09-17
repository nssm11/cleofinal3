import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect("/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="shell-wide">
      <div className="border-x border-line min-h-[calc(100dvh-64px)] flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] border border-line bg-bg p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">03 — Sécurité</p>
          <h1 className="mt-4 font-sans text-[24px] font-semibold tracking-[-0.02em]">Nouveau mot de passe</h1>
          <p className="mt-3 font-sans text-[13px] text-text-secondary">{t.forgotIntro}</p>
          <div className="mt-8"><ForgotPasswordForm /></div>
        </div>
      </div>
    </div>
  );
}
