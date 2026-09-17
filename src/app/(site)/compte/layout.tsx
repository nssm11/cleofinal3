import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { formatDate } from "@/lib/utils";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Mon compte", template: "%s — Mon compte" },
  robots: { index: false, follow: false },
};

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const [user, copy] = await Promise.all([getCurrentUser(), getCopy()]);
  if (!user) redirect("/connexion?next=/compte");
  const t = copy.account;

  return (
    <div className="border-b border-line">
      <div className="shell-wide">
        <div className="border-x border-line">
          <header className="border-b border-line px-8 py-10 lg:px-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{t.kicker} — {formatDate(user.createdAt)}</p>
                <h1 className="mt-3 font-sans text-[32px] font-bold leading-[0.95] tracking-[-0.03em]">Bonjour, {user.firstName}.</h1>
                <p className="mt-2 font-mono text-[11px] text-text-muted truncate max-w-[40ch]">{user.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/compte/fidelite" className="border border-ink bg-ink px-6 py-3 text-paper font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-ink-2">
                  {user.loyaltyPoints} points
                </Link>
                {(user.role === "admin" || user.role === "support") && <Link href="/admin" className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">Admin →</Link>}
              </div>
            </div>
          </header>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-12 lg:px-12 lg:py-10">
            <AccountNav />
            <div className="min-w-0 lg:col-span-9">{children}</div>
          </div>
        </div>
      </div>
      <NotificationToast />
    </div>
  );
}
