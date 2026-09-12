import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { AccountNav } from "@/components/account/account-nav";
import { Atmosphere } from "@/components/motion/atmosphere";
import { formatDate } from "@/lib/utils";
import { getCopy } from "@/lib/i18n/server";
import { ArrowRightIcon, LogoutIcon } from "@/components/icons";

/**
 * LE SALON PARTICULIER — the customer's own room.
 *
 * Not a dashboard: no tiles, no charts, no counters competing for attention.
 * The name arrives first and large, the practical facts sit beneath it as a
 * single line of small type, and the navigation is a numbered editorial rail
 * rather than a set of boxes.
 */
/** Private area: titled for the customer, invisible to search engines. */
export const metadata: Metadata = {
  title: { default: "Mon compte", template: "%s — Mon compte" },
  robots: { index: false, follow: false },
};

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const [user, copy] = await Promise.all([getCurrentUser(), getCopy()]);
  if (!user) redirect("/connexion?next=/compte");
  const staff = user.role === "admin" || user.role === "support";
  const t = copy.account;

  return (
    <div className="relative">
      <Atmosphere tone="ivory" halo={false} />

      <header className="relative border-b border-stone/70">
        <div className="container-wide pb-10 pt-28 lg:pb-14 lg:pt-36">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-8">
              <p className="eyebrow mb-6">{t.kicker}</p>
              <h1 className="font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[0.98] tracking-[-0.028em] text-ink">
                {t.hello}
                <span className="italic text-champagne-2"> {user.firstName}</span>
              </h1>
              <p className="mt-5 text-[13px] text-muted">
                {t.since.replace("{date}", formatDate(user.createdAt)).replace("{email}", user.email)}
              </p>
            </div>

            <div className="lg:col-span-4 lg:pt-3">
              <p className="eyebrow mb-4 text-muted-2">{t.loyaltyBlock}</p>
              <p className="font-display text-[clamp(2.6rem,6vw,3.6rem)] leading-none tabular-nums text-ink">
                {user.loyaltyPoints}
                <span className="ms-3 text-[0.3em] uppercase tracking-[0.2em] text-muted-2">{t.points}</span>
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone/70 pt-5 text-[11px] font-bold uppercase tracking-[0.16em]">
                {staff && (
                  <Link
                    href="/admin"
                    className="group inline-flex items-center gap-2 text-champagne-2 transition-colors hover:text-ink"
                  >
                    {t.admin}
                    <ArrowRightIcon size={12} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </Link>
                )}
                <form action={logoutAction}>
                  <button className="inline-flex items-center gap-2 text-muted-2 transition-colors hover:text-ink">
                    <LogoutIcon size={12} /> {t.leave}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container-wide grid gap-10 py-rhythm lg:grid-cols-12 lg:gap-14 lg:py-rhythm-lg">
        <AccountNav />
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
