import Link from "next/link";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE NOM — la signature de la maison.
   ──────────────────────────────────────────────────────────────────────────
   One lockup, three sizes. Didone for the name, monospace for the descriptor:
   the two voices of the identity, always in the same order, never stretched,
   never letter-spaced into a logo. The descriptor is the house's address —
   Ez Zahra, Hammam-Lif — because that is what makes this house this house.
   ══════════════════════════════════════════════════════════════════════════ */

const SIZES = {
  sm: { name: "text-[1.05rem]", desk: "text-[0.5rem]" },
  md: { name: "text-[1.3rem]", desk: "text-[0.5625rem]" },
  lg: { name: "text-[clamp(1.6rem,2.4vw,2.1rem)]", desk: "text-[0.5625rem]" },
} as const;

export function Brand({
  size = "md",
  light = false,
  descriptor = true,
  href = "/",
  className,
}: {
  size?: keyof typeof SIZES;
  light?: boolean;
  descriptor?: boolean;
  href?: string | null;
  className?: string;
}) {
  const s = SIZES[size];
  const body = (
    <span className={cn("group/brand inline-flex items-baseline gap-3", className)}>
      <span
        className={cn(
          "font-display leading-none tracking-[-0.02em] transition-colors duration-500",
          s.name,
          light ? "text-alabaster group-hover/brand:text-cinabre-3" : "text-ink group-hover/brand:text-cinabre",
        )}
      >
        Cléopâtre
      </span>
      {descriptor && (
        <span
          className={cn(
            "hidden font-mono uppercase leading-none tracking-[0.22em] transition-colors sm:inline",
            s.desk,
            light ? "text-haze-2 group-hover/brand:text-haze" : "text-ash group-hover/brand:text-graphite",
          )}
        >
          Ez Zahra · Hammam-Lif
        </span>
      )}
    </span>
  );

  if (!href) return body;
  return (
    <Link href={href} aria-label="Cléopâtre — accueil" className="shrink-0">
      {body}
    </Link>
  );
}
