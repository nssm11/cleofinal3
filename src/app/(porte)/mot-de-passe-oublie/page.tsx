import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { AuthRoom, LedgerHead } from "@/components/account/auth-room";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

/**
 * LA LETTRE — une affaire privée, traitée en privé.
 *
 * No film here: the house does not decorate a password reset. The night field
 * holds the promise («un lien, une heure, rien de plus») and the ledger holds
 * one field, one gesture, and the way back to the door.
 */
export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect("/compte");
  const t = (await getCopy()).auth;

  return (
    <AuthRoom
      kicker="La lettre"
      lines={[{ t: "Un lien, une heure," }, { t: "rien de plus.", em: true }]}
      caption={t.forgotIntro}
      facts={t.facts}
      rail="MOT DE PASSE — COURRIER PRIVÉ"
    >
      <LedgerHead kicker="Le temps d'un" title="nouveau mot de passe" em="en douceur" lead={t.forgotIntro} />
      <div className="mt-9">
        <ForgotPasswordForm />
      </div>
    </AuthRoom>
  );
}
