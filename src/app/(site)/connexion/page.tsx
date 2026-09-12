import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
import { getCopy } from "@/lib/i18n/server";
export const metadata: Metadata = { title: "Connexion", robots: { index: false } };
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  return (
    <AuthShell kicker={t.loginKicker} title={<>{t.loginTitle1} <em className="text-champagne-2">{t.loginTitle2}</em></>}>
      <LoginForm next={safeNext || undefined} />
    </AuthShell>
  );
}
