import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { CountUp } from "@/components/account/account-motion";
import { AccountCard } from "@/components/account/account-ui";
import { Atmosphere } from "@/components/motion/atmosphere";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/utils";
import { getCopy } from "@/lib/i18n/server";
import { ArrowRightIcon } from "@/components/icons";

/**
 * LE SALON PARTICULIER — the customer's own room.
 *
 * The name arrives first, printed up from its baseline, and the practical
 * facts sit beneath it as a single line of small type. On the right, the
 * membership plate — the balance, set large, one door into the cercle.
 * Below, the space is cut in two: the sommaire (the rail of rooms) and the
 * room the customer is standing in.
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

      <header className="relative border-b border-stone/60">
        <div className="container-wide pb-10 pt-28 lg:pb-14 lg:pt-36">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-8">
              <p className="eyebrow mb-6">{t.kicker}</p>
              <h1 className="font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[0.98] tracking-[-0.028em] text-ink">
                <MaskLine>
                  {t.hello}
                  <span className="italic text-champagne-2"> {user.firstName}</span>
                </MaskLine>
              </h1>
              <p className="mt-5 text-[13px] text-muted">
                {t.since.replace("{date}", formatDate(user.createdAt)).replace("{email}", user.email)}
              </p>
            </div>

            <div className="lg:col-span-4 lg:pt-3">
              <Reveal y={10} amount={0.05}>
                <AccountCard accent className="group">
                  <Link href="/compte/fidelite" className="absolute inset-0" aria-label={t.loyaltyBlock} />
                  <div className="relative p-6 lg:p-7">
                    <div className="flex items-start justify-between">
                      <p className="eyebrow text-muted-2">{t.loyaltyBlock}</p>
                      <ArrowRightIcon
                        size={13}
                        className="mt-1 text-sand-2 transition-all duration-500 group-hover:translate-x-1 group-hover:text-champagne-2"
                      />
                    </div>
                    <p className="mt-5 font-display text-[clamp(2.4rem,4.6vw,3.2rem)] leading-none text-ink">
                      <CountUp value={user.loyaltyPoints} />
                      <span className="ms-3 text-[0.28em] uppercase tracking-[0.2em] text-muted-2">{t.points}</span>
                    </p>
                    <p className="mt-4 border-t border-stone/60 pt-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-champagne-2 transition-colors duration-500 group-hover:text-ink">
                      Cercle Cléopâtre
                    </p>
                  </div>
                </AccountCard>
              </Reveal>
              {staff && (
                <Link
                  href="/admin"
                  className="group mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-champagne-2 transition-colors hover:text-ink"
                >
                  {t.admin}
                  <ArrowRightIcon size={11} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative container-wide grid gap-10 py-rhythm lg:grid-cols-12 lg:gap-14 lg:py-rhythm-lg">
        <AccountNav />
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
      <NotificationToast />
    </div>
  );
}
