
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readLocale } from "@/lib/locale";
import { t } from "@/i18n";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await readLocale(), "auth.loginKicker"), robots: { index: false, follow: false } };
}
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, locale] = await Promise.all([searchParams, readLocale()]);
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  return (
    <AuthShell
      kicker={t(locale, "auth.loginKicker")}
      title={
        <>
          {t(locale, "auth.loginTitle1")}
          <em className="text-champagne-2">{t(locale, "auth.loginTitle2")}</em>
        </>
      }
    >
      <LoginForm next={safeNext || undefined} locale={locale} />
    </AuthShell>
  );
}
