"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { logoutAction } from "@/actions/auth";
import { LogOut } from "lucide-react";

export function AccountNav() {
  const p = usePathname();
  const { copy } = useLocale();
  const n = copy.account.nav;
  const items = [
    { href: "/compte", l: n.overview[1], n: "01" },
    { href: "/compte/commandes", l: n.orders[1], n: "02" },
    { href: "/compte/favoris", l: n.favorites[1], n: "03" },
    { href: "/compte/rituels", l: n.rituals[1], n: "04" },
    { href: "/compte/fidelite", l: n.fidelite[1], n: "05" },
    { href: "/compte/abonnement", l: n.abonnement[1], n: "06" },
    { href: "/compte/support", l: n.support[1], n: "07" },
    { href: "/compte/profil", l: n.profil[1], n: "08" },
  ];

  const isActive = (href: string) => (href === "/compte" ? p === href : p.startsWith(href));

  return (
    <nav aria-label={copy.account.summary} className="lg:col-span-3">
      {/* Mobile */}
      <div className="sticky top-[64px] z-20 -mx-4 mb-8 border-y border-line bg-bg px-4 py-3 lg:hidden">
        <ul className="flex gap-2 overflow-x-auto scrollbar-none">
          {items.map((it) => (
            <li key={it.href} className="shrink-0">
              <Link href={it.href} className={cn("flex h-9 items-center border px-3 font-mono text-[11px] uppercase tracking-[0.06em]", isActive(it.href) ? "border-ink bg-ink text-paper" : "border-line bg-bg")}>
                {it.l}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block sticky top-[80px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-6">Compte — Sommaire</p>
        <ul className="border-t border-line">
          {items.map((it) => (
            <li key={it.href} className="border-b border-line">
              <Link href={it.href} className={cn("flex items-center justify-between py-4 font-sans text-[14px] transition-colors", isActive(it.href) ? "text-ink font-medium" : "text-text-secondary hover:text-ink")}>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-text-muted">{it.n}</span>
                  {it.l}
                </span>
                {isActive(it.href) && <span className="h-px w-6 bg-ink" />}
              </Link>
            </li>
          ))}
        </ul>
        <form action={logoutAction} className="mt-8 border-t border-line pt-6">
          <button type="submit" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted hover:text-ink">
            <LogOut size={12} /> {copy.account.leave}
          </button>
        </form>
      </div>
    </nav>
  );
}
