import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { AuthRoom, LedgerHead } from "@/components/account/auth-room";
import { getCopy } from "@/lib/i18n/server";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * LA NOUVELLE CLÉ — le lien est la lettre, le champ est la clé.
 *
 * The token is verified before the form is even drawn: an expired or already
 * burnt link shows the apology, never a form doomed to fail. The room is the
 * same as the other doors — night on one side, register on the other.
 */
export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const copy = await getCopy();
  const t = copy.auth;
  const row = await db.query.passwordResets.findFirst({
    where: eq(passwordResets.tokenHash, createHash("sha256").update(decodeURIComponent(token ?? "")).digest("hex")),
  });
  const valid = !!row && !row.usedAt && row.expiresAt > new Date();

  return (
    <AuthRoom
      kicker={valid ? "Un clic, une nouvelle clé" : "Lien expiré"}
      lines={valid ? [{ t: "Une clé neuve" }, { t: "pour la même maison.", em: true }] : [{ t: "Cette lettre" }, { t: "n'ouvre plus.", em: true }]}
      caption={
        valid
          ? "Choisissez un mot de passe que vous n'utilisez nulle part ailleurs. Le lien s'éteint dès qu'il a servi."
          : "Le lien a déjà servi, ou il a expiré au bout d'une heure. Demandez-en un nouveau : c'est immédiat."
      }
      facts={t.facts}
      rail="NOUVELLE CLÉ — ACCÈS SÉCURISÉ"
    >
      <LedgerHead kicker={valid ? "Dernière étape" : "Lien expiré"} title={valid ? t.resetTitle : t.resetInvalid} />
      <div className="mt-9">
        <ResetPasswordForm token={valid ? (token ?? "") : ""} invalid={!valid} />
      </div>
    </AuthRoom>
  );
}
