import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * LA COUPE — shared atoms of the « Maison en coupe » homepage.
 *
 * One spatial idea runs through all of them: the page is the architectural
 * section of a house. Registers are floors, products stand in horseshoe niches,
 * labels are engraved micro-caps, and the rules that separate floors are the
 * courses of a stone wall. These parts are deliberately dry — the composition,
 * not the CSS, carries the concept.
 */

/** Micro-caps label with the hairline the registers wear. */
export function CoupeLabel({ children, className = "", light = false }: { children: ReactNode; className?: string; light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-3 text-[9.5px] font-extrabold uppercase tracking-[0.32em] ${
        light ? "text-paper/55" : "text-charcoal-2"
      } ${className}`}
    >
      <span aria-hidden className={`h-px w-7 ${light ? "bg-paper/30" : "bg-brass/60"}`} />
      {children}
    </p>
  );
}

/** Oversized outlined numeral — the index of a register, drawn not filled. */
export function CoupeIndex({ n, className = "" }: { n: string; className?: string }) {
  return (
    <span aria-hidden className={`font-display leading-none reg-incise ${className}`}>
      {n}
    </span>
  );
}

/**
 * A horseshoe-arched niche: the frame every object in the house stands in.
 * Purely presentational — parents decide what the niche links to.
 */
export function Niche({
  src,
  alt,
  sizes,
  priority = false,
  tone = "plaster",
  className = "",
  children,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  tone?: "plaster" | "deep" | "glass";
  className?: string;
  children?: ReactNode;
  fit?: "cover" | "contain";
}) {
  const bg = tone === "deep" ? "bg-[#26201a]" : tone === "glass" ? "bg-[#efe7d4]" : "bg-[#e8dfc9]";
  return (
    <div className={`relative overflow-hidden reg-arch ${bg} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`${fit === "cover" ? "object-cover" : "object-contain p-[7%]"} transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]`}
        />
      ) : null}
      {/* Niche shadow — the inside of an arch is never flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            tone === "deep"
              ? "radial-gradient(90% 60% at 50% 0%, rgba(244,236,216,0.16), rgba(0,0,0,0.42) 78%)"
              : "linear-gradient(180deg, rgba(33,27,18,0.16), rgba(255,255,255,0.24) 34%, rgba(33,27,18,0.10))",
        }}
      />
      {children}
    </div>
  );
}

/** A caption line under a niche: brand micro-caps above a display name. */
export function CoupeCaption({
  overline,
  title,
  meta,
  light = false,
  className = "",
}: {
  overline: string | null;
  title: ReactNode;
  meta?: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {overline ? (
        <p className={`text-[8.5px] font-extrabold uppercase tracking-[0.26em] ${light ? "text-paper/45" : "text-muted-2"}`}>{overline}</p>
      ) : null}
      <p className={`mt-1.5 line-clamp-2 font-display text-[16px] leading-[1.25] transition-colors duration-500 ${light ? "text-paper/90 group-hover:text-brasslight" : "text-ink group-hover:text-brass"}`}>
        {title}
      </p>
      {meta ? <p className={`mt-1 text-[11.5px] tabular-nums ${light ? "text-paper/55" : "text-muted"}`}>{meta}</p> : null}
    </div>
  );
}

/** A hairline with end ticks — the joint between two courses of stone. */
export function CoupeRule({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <div aria-hidden className={`relative h-px w-full ${light ? "bg-paper/15" : "bg-stone"} ${className}`}>
      <span className={`absolute inset-y-0 ltr:left-0 rtl:right-0 w-px ${light ? "bg-paper/25" : "bg-stone-2"}`} />
      <span className={`absolute inset-y-0 ltr:right-0 rtl:left-0 w-px ${light ? "bg-paper/25" : "bg-stone-2"}`} />
    </div>
  );
}

/** Small engraved price pair — the house never shouts a discount. */
export function CoupePrice({
  price,
  compareAt,
  light = false,
  className = "",
}: {
  price: string;
  compareAt?: string | null;
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${light ? "text-paper" : "text-ink"} ${className}`}>
      {price}
      {compareAt ? <span className={`ml-2 text-[0.82em] line-through ${light ? "text-paper/40" : "text-muted-2"}`}>{compareAt}</span> : null}
    </span>
  );
}

/** A quiet link that scrolls into a register (the façade's only CTA). */
export function CoupeScrollLink({ target, children, className = "" }: { target: string; children: ReactNode; className?: string }) {
  // Plain anchor: native smooth behavior is opted into by the root element;
  // this keeps keyboard, middle-click and URL semantics of a real link.
  return (
    <Link href={`#${target}`} className={className}>
      {children}
    </Link>
  );
}
