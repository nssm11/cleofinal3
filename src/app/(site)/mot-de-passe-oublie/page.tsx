import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect("/compte");
  const t = (await getCopy()).auth;
  return (
    <AuthShell
      kicker="Le temps d'un"
      title={
        <>
          nouveau mot de passe <em className="text-champagne-2">en douceur</em>
        </>
      }
      note={t.forgotIntro}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
