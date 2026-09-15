import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";
import { getCopy } from "@/lib/i18n/server";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * LA NOUVELLE CLÉ — the link is the letter, the form is the key.
 *
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

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper">
      <Atmosphere tone="ivory" ribs={false} halo />

      <div className="relative flex min-h-dvh items-center justify-center px-5 py-16 lg:px-8">
        <div className="w-full max-w-[26rem]">
          <Reveal y={12} amount={0.05}>
            {/* A single champagne rule — the keyhole's light. */}
            <div aria-hidden className="mb-8 h-px w-20 bg-gradient-to-r from-champagne-2 to-transparent" />
            <p className="rule-label mb-5">{valid ? "Un clic, une nouvelle clé" : "Lien expiré"}</p>
            <h1 className="font-display text-[clamp(1.8rem,3.2vw,2.5rem)] leading-[1.06] tracking-[-0.024em] text-ink">
              {valid ? t.resetTitle : t.resetInvalid}
            </h1>
          </Reveal>

          <Reveal y={14} delay={0.07} amount={0.05}>
            <div className="mt-9 border border-champagne/25 bg-ivory p-6 shadow-soft sm:p-8">
              <ResetPasswordForm token={valid ? token ?? "" : ""} invalid={!valid} />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
