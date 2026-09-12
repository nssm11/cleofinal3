import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { RegisterForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
import { getCopy } from "@/lib/i18n/server";
export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };
export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  return (
    <AuthShell kicker={t.registerKicker} title={<>{t.registerTitle1} <em className="text-champagne-2">{t.registerTitle2}</em></>}>
      <RegisterForm next={safeNext || undefined} />
    </AuthShell>
  );
}
