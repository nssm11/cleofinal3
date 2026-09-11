
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readLocale } from "@/lib/locale";
import { t } from "@/i18n";
import { RequestPasswordResetForm, ResetPasswordForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await readLocale(), "auth.resetRequestKicker"), robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

/**
 * LE SEUIL DE SECOURS.
 *
 * One page, two states: asking for a link, or using one. Which one is decided
 * by the shape of `?token=` alone — the page never checks whether a token is
 * still live, because that would turn the URL bar into an oracle. The action
 * answers that question, and only to whoever holds the link.
 */
export default async function MotDePassePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (await getCurrentUser()) redirect("/compte");
  const [{ token }, locale] = await Promise.all([searchParams, readLocale()]);
  const safeToken = typeof token === "string" && /^[a-f0-9]{64}$/.test(token) ? token : null;

  return safeToken ? (
    <AuthShell
      kicker={t(locale, "auth.resetKicker")}
      title={<em className="text-champagne-2">{t(locale, "auth.resetTitle")}</em>}
      note={t(locale, "auth.resetNote")}
    >
      <ResetPasswordForm token={safeToken} locale={locale} />
    </AuthShell>
  ) : (
    <AuthShell
      kicker={t(locale, "auth.resetRequestKicker")}
      title={<em className="text-champagne-2">{t(locale, "auth.resetRequestTitle")}</em>}
      note={t(locale, "auth.resetRequestNote")}
    >
      <RequestPasswordResetForm locale={locale} />
    </AuthShell>
  );
}
