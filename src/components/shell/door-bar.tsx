"use client";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { ArrowRightIcon, BagIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LA RÈGLE — la barre des pages privées.
   ──────────────────────────────────────────────────────────────────────────
   A private page does not carry the mega-nav. It carries a strip: the name,
   the way back to the shop, the bag. Porcelain glass over whatever film the
   page is showing, one hairline, and nothing that competes with the register.
   ══════════════════════════════════════════════════════════════════════════ */

export function DoorBar({ user }: { user: { firstName: string | null } | null }) {
  const { count, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-porcelain/78 backdrop-blur-xl">
      <div className="container-wide flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Cléopâtre — accueil" className="group flex items-baseline gap-3">
          <span className="font-display text-[1.3rem] leading-none tracking-[-0.02em] text-ink">Cléopâtre</span>
          <span className="hidden font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-ash transition-colors group-hover:text-graphite sm:block">
            Ez Zahra · Hammam-Lif
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/boutique"
            className="hidden items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-graphite transition-colors hover:text-ink sm:flex"
          >
            La boutique
            <ArrowRightIcon size={12} className="rtl-mirror" />
          </Link>
          {user ? (
            <Link href="/compte" className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink">
              {user.firstName ?? "Mon espace"}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={open}
            aria-label={count > 0 ? `Votre sac — ${count} article${count > 1 ? "s" : ""}` : "Votre sac"}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center border transition-colors",
              count > 0 ? "border-ink text-ink" : "border-rule-strong text-graphite hover:border-ink hover:text-ink",
            )}
          >
            <BagIcon size={16} />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-cinabre px-1 font-mono text-[0.5625rem] leading-none text-white">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
