"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Marquee } from "@/components/kit/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LE BANDEAU — the house's own line, running under the bar.

   A single ruled strip of mono promises, carrying real information: the
   delivery promise, the counter's address, the payment methods the officine
   actually accepts. It exists on the pages that need the reassurance — the
   shared list, the gift card, the follow-up — and nowhere else.
   ══════════════════════════════════════════════════════════════════════════ */

const LINES = [
  "Livraison 48 h partout en Tunisie",
  "Paiement à la livraison",
  "Conseil pharmacien sur chaque référence",
  "Comptoir d'Ezzahra — Hammam-Lif",
];

export function AnnouncementStrip({ tone = "day" }: { tone?: "day" | "night" }) {
  const pathname = usePathname();
  const night = tone === "night";

  return (
    <div
      className={
        night
          ? "relative border-b border-night-line bg-petrol py-3 text-chalk-muted"
          : "relative border-b border-line bg-mist py-3 text-muted"
      }
    >
      <div className="shell-wide flex items-center gap-6">
        {pathname !== "/" && (
          <Link href="/boutique" className="btn-ghost shrink-0 text-[0.6875rem]">
            La boutique
          </Link>
        )}
        <Marquee
          items={LINES.map((l) => (
            <span key={l} className="kicker-xs !text-current flex items-center gap-3">
              <span aria-hidden className="marker bg-iodine" />
              {l}
            </span>
          ))}
          className="min-w-0 flex-1"
        />
      </div>
    </div>
  );
}

/**
 * LE MONOGRAMME — the name, set as the house sets it: poster caps, a signal
 * marker, and the two comptoirs stated in mono beneath.
 */
export function Wordmark({
  size = "md",
  tone = "day",
  className,
}: {
  size?: "sm" | "md" | "lg";
  tone?: "day" | "night";
  className?: string;
}) {
  const night = tone === "night";
  const sizeClass = size === "sm" ? "text-[1.1rem]" : size === "lg" ? "text-[clamp(1.8rem,4vw,3rem)]" : "text-[1.5rem]";
  return (
    <span className={className}>
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="notch-sm block h-3 w-3 bg-iodine" />
        <span
          className={`font-ant uppercase leading-none tracking-[0.14em] ${sizeClass} ${ night ? "text-chalk" : "text-carbon" }`}
        >
          Cléopâtre
        </span>
      </span>
      {size !== "sm" && (
        <span className={`kicker-xs mt-2 block ${night ? "text-chalk-faint" : "text-faint"}`}>
          Officine dermo-cosmétique — Ezzahra · Hammam-Lif
        </span>
      )}
    </span>
  );
}
