import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
import { getCopy } from "@/lib/i18n/server";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The link's token is checked before the form even appears: an expired or
 * burnt token shows the apology, not a form that is doomed to fail.
 */
export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const copy = await getCopy();
  const t = copy.auth;
  const row = await db.query.passwordResets.findFirst({
    where: eq(passwordResets.tokenHash, createHash("sha256").update(decodeURIComponent(token ?? "")).digest("hex")),
  });
  const valid = !!row && !row.usedAt && row.expiresAt > new Date();
  if (!valid) {
    return (
      <AuthShell kicker="Lien expiré" title={<>{t.resetInvalid}</>}>
        <ResetPasswordForm token={""} invalid />
      </AuthShell>
    );
  }
  return (
    <AuthShell kicker="Un clic, une nouvelle clé" title={<>{t.resetTitle}</>}>
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
