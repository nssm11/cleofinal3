import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { getCopy } from "@/lib/i18n/server";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const copy = await getCopy();
  const t = copy.auth;
  const row = await db.query.passwordResets.findFirst({ where: eq(passwordResets.tokenHash, createHash("sha256").update(decodeURIComponent(token ?? "")).digest("hex")) });
  const valid = !!row && !row.usedAt && row.expiresAt > new Date();

  return (
    <div className="shell-wide">
      <div className="border-x border-line min-h-[calc(100dvh-64px)] flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] border border-line bg-bg p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">04 — Réinitialisation</p>
          <h1 className="mt-4 font-sans text-[24px] font-semibold tracking-[-0.02em]">{valid ? t.resetTitle : t.resetInvalid}</h1>
          <div className="mt-8"><ResetPasswordForm token={valid ? token ?? "" : ""} invalid={!valid} /></div>
        </div>
      </div>
    </div>
  );
}
