"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { logoutAction } from "@/actions/auth";
import { SupportUnreadBadge } from "@/components/account/support-unread-badge";
import { NotificationNavBadge } from "@/components/notifications/notification-nav-badge";
import {
  BellIcon,
  ChatIcon,
  HeartIcon,
  HomeIcon,
  LogoutIcon,
  MoonIcon,
  PackageIcon,
  RefreshIcon,
  StarIcon,
  SwapIcon,
  UserIcon,
} from "@/components/icons";

/**
 * THE SOMMAIRE — the rail of a private room.
 *
 * Desktop: a numbered editorial column, sticky, each room marked by its
 * numeral, its glyph and a one-line promise; the champagne hairline travels
 * to the room the customer stands in. Mobile: the rail folds into a sticky
 * row of chips that one thumb can reach — including the door out.
 */
const GLYPHS: Record<string, typeof HomeIcon> = {
  "/compte": HomeIcon,
  "/compte/notifications": BellIcon,
  "/compte/commandes": PackageIcon,
  "/compte/favoris": HeartIcon,
  "/compte/rituels": MoonIcon,
  "/compte/fidelite": StarIcon,
  "/compte/abonnement": RefreshIcon,
  "/compte/support": ChatIcon,
  "/compte/retours": SwapIcon,
  "/compte/profil": UserIcon,
};

export function AccountNav() {
  const p = usePathname();
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const n = copy.account.nav;
  const items = [
    { href: "/compte", l: n.overview[1], d: n.overview[2], n: n.overview[0] },
    { href: "/compte/notifications", l: n.notifications[1], d: n.notifications[2], n: n.notifications[0] },
    { href: "/compte/commandes", l: n.orders[1], d: n.orders[2], n: n.orders[0] },
    { href: "/compte/favoris", l: n.favorites[1], d: n.favorites[2], n: n.favorites[0] },
    { href: "/compte/rituels", l: n.rituals[1], d: n.rituals[2], n: n.rituals[0] },
    { href: "/compte/fidelite", l: n.fidelite[1], d: n.fidelite[2], n: n.fidelite[0] },
    { href: "/compte/abonnement", l: n.abonnement[1], d: n.abonnement[2], n: n.abonnement[0] },
    { href: "/compte/support", l: n.support[1], d: n.support[2], n: n.support[0] },
    { href: "/compte/retours", l: n.returns[1], d: n.returns[2], n: n.returns[0] },
    { href: "/compte/profil", l: n.profil[1], d: n.profil[2], n: n.profil[0] },
  ] as const;

  const isActive = (href: string) => (href === "/compte" ? p === href : p.startsWith(href));

  return (
    <nav aria-label={copy.account.summary} className="lg:col-span-3">
      {/* ── Mobile : the row of rooms, one thumb away ─────────────────── */}
      <div className="sticky top-16 z-30 -mx-5 mb-9 border-y border-line/60 bg-canvas/92 px-5 py-3 backdrop-blur-md lg:hidden">
        <ul className="scrollbar-none -my-1 flex gap-2 overflow-x-auto py-1">
          {items.map((it) => {
            const Icon = GLYPHS[it.href];
            const active = isActive(it.href);
            return (
              <li key={it.href} className="shrink-0">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-300",
                    active
                      ? "border-iodine/70 bg-iodine-wash/80 text-carbon"
                      : "border-line/60 bg-canvas/70 text-muted",
                  )}
                >
                  <Icon size={13} />
                  {it.l}
                  {it.href === "/compte/support" && (
                    <span className="relative -me-1 flex h-4 min-w-4 items-center justify-center">
                      <SupportUnreadBadge className="absolute inset-0" />
                    </span>
                  )}
                  {it.href === "/compte/notifications" && (
                    <span className="relative -me-1 flex h-4 min-w-4 items-center justify-center">
                      <NotificationNavBadge className="absolute inset-0" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label={copy.account.leave}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line/60 bg-canvas/70 text-muted transition-colors hover:text-carbon"
              >
                <LogoutIcon size={14} />
              </button>
            </form>
          </li>
        </ul>
      </div>

      {/* ── Desktop : the rail ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <p className="kicker mb-7">{copy.account.summary}</p>

          <ul className="border-t border-line/60">
            {items.map((it) => {
              const Icon = GLYPHS[it.href];
              const active = isActive(it.href);
              return (
                <li key={it.href} className="relative">
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-start gap-4 border-b border-line/60 py-4 pr-3 transition-colors duration-500",
                      active ? "text-carbon" : "text-steel hover:text-carbon",
                    )}
                  >
                    {active && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-0 bg-iodine-wash"
                        initial={false}
                      />
                    )}
                    <span
                      className={cn(
                        "relative pt-0.5 font-sans text-[11px] italic tabular-nums transition-colors duration-500",
                        active ? "text-iodine" : "text-faint",
                      )}
                    >
                      {it.n}
                    </span>
                    <span
                      className={cn(
                        "relative flex h-9 w-9 shrink-0 items-center justify-center border transition-colors duration-500",
                        active
                          ? "border-iodine/60 bg-porcelain text-iodine"
                          : "border-line/60 bg-porcelain/50 text-faint group-hover:text-iodine",
                      )}
                    >
                      <Icon size={15} />
                      {it.href === "/compte/support" && (
                        <span className="absolute -end-1 -top-1">
                          <SupportUnreadBadge />
                        </span>
                      )}
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[14px] transition-colors duration-500",
                          active ? "text-carbon" : "text-steel group-hover:text-carbon",
                        )}
                      >
                        {it.l}
                      </span>
                      <span className="mt-1 block max-w-[15rem] text-[11.5px] leading-snug text-faint">{it.d}</span>
                    </span>

                    {active && (
                      <motion.span
                        layoutId="account-rail"
                        aria-hidden
                        className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-iodine"
                        transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-9">
            <p className="kicker mb-3 text-iodine">{copy.account.question}</p>
            <p className="text-[12.5px] leading-relaxed text-muted">{copy.account.questionText}</p>
            <a href="tel:+21671450210" className="link-underline mt-4 inline-flex font-sans text-[19px] text-carbon">
              71 450 210
            </a>
          </div>

          <div className="mt-9 border-t border-line/60 pt-6">
            <form action={logoutAction}>
              <button
                type="submit"
                className="group inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-faint transition-colors duration-300 hover:text-carbon"
              >
                <LogoutIcon size={14} className="transition-transform duration-500 group-hover:-translate-x-0.5" />
                {copy.account.leave}
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
