import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { CountUp } from "@/components/account/account-motion";
import { Atmosphere } from "@/components/motion/atmosphere";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/utils";
import { getCopy } from "@/lib/i18n/server";
import { ArrowRightIcon, StarIcon } from "@/components/icons";

/**
 * LE SALON PARTICULIER — the customer's own room, opened without ceremony.
 *
 * The first viewport carries the greeting, the loyalty balance and the
 * doors — no giant masthead, no scroll before meaning. Below, the space is
 * cut in two: the sommaire (the rail of rooms) and the room the customer
 * is standing in.
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
      <Atmosphere tone="ivory" />

      <header className="relative border-b border-line/60 bg-mist/50">
        <div className="shell-wide flex flex-wrap items-end justify-between gap-x-10 gap-y-5 py-8 lg:py-10">
          <div className="min-w-0">
            <p className="kicker-xs mb-3">{t.kicker}</p>
            <h1 className="font-ant uppercase text-[clamp(1.7rem,3.8vw,2.5rem)] leading-[1.02] tracking-[-0.024em] text-carbon">
              <MaskLine>
                {t.hello}
                <span className="text-iodine-deep"> {user.firstName}</span>
              </MaskLine>
            </h1>
            <p className="mt-2.5 max-w-xl truncate text-[12.5px] text-muted">
              {t.since.replace("{date}", formatDate(user.createdAt)).replace("{email}", user.email)}
            </p>
          </div>

          <Reveal y={10} amount={0.05} className="shrink-0">
            <div className="flex items-center gap-5">
              <Link
                href="/compte/fidelite"
                className="group flex items-center gap-4 border border-line/60 bg-porcelain px-5 py-3.5 shadow-sheet transition-[border-color,box-shadow] duration-500 hover:border-iodine-deep/60 hover:shadow-sheet"
                aria-label={t.loyaltyBlock}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-iodine-deep/40 bg-iodine-wash/60 text-iodine-deep">
                  <StarIcon size={16} />
                </span>
                <span>
                  <span className="block font-ant uppercase text-[1.65rem] leading-none tabular-nums text-carbon">
                    <CountUp value={user.loyaltyPoints} />
                  </span>
                  <span className="mt-1 block text-[9.5px] font-bold uppercase tracking-[0.18em] text-faint">
                    {t.points} · Cercle Cléopâtre
                  </span>
                </span>
                <ArrowRightIcon
                  size={13}
                  className="text-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-iodine-deep rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>
              {staff && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-iodine-deep transition-colors hover:text-carbon sm:inline-flex"
                >
                  {t.admin}
                  <ArrowRightIcon size={11} />
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      <div className="relative shell-wide grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-10">
        <AccountNav />
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
      <NotificationToast />
    </div>
  );
}
