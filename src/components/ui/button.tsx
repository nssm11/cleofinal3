import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Buttons of the house: machined corners, tungsten light, a press that moves
 * the whole control 1px — no bubbles, no springs. Variants:
 *
 * · primary — the lamp is on (play, confirm)
 * · ghost — hairline frame (secondary actions)
 * · link — program-note link: hairline underline that thickens on hover
 */

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-frame font-medium select-none " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-(--duration-flip) ease-(--ease-shutter) " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-40 disabled:translate-y-0";

const variants = {
  primary:
    "bg-tungsten text-night px-6 h-11 text-[15px] font-semibold hover:bg-ember shadow-[0_0_0_0_rgba(232,163,61,0)] hover:shadow-[0_0_24px_-6px_rgba(232,163,61,0.45)]",
  "primary-lg":
    "bg-tungsten text-night px-8 h-13 text-base font-semibold rounded-frame hover:bg-ember hover:shadow-[0_0_36px_-8px_rgba(232,163,61,0.5)]",
  ghost:
    "border border-rule text-bone px-5 h-10 text-sm hover:border-tungsten/50 hover:text-tungsten",
  danger: "border border-cinnabar/50 text-cinnabar px-5 h-10 text-sm hover:bg-cinnabar hover:text-night hover:border-cinnabar",
  link: "text-ash underline decoration-rule underline-offset-6 decoration-1 hover:text-bone hover:decoration-tungsten transition-colors duration-(--duration-flip) px-0 h-auto",
} as const;

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants;
}

export function Button({ variant = "primary", className, ...props}: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
  ...props
}: { variant?: keyof typeof variants; className?: string; href: string } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

/** The play control: a lens that lights up — used everywhere playback starts. */
export function PlayBadge({ label = "شغّل", size = "md" }: { label?: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-semibold",
        size === "lg" ? "text-base" : "text-sm",
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-lens bg-tungsten text-night transition-transform duration-(--duration-slide) ease-(--ease-projector) group-hover:scale-105",
          size === "lg" ? "size-12" : "size-9",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className={size === "lg" ? "size-5" : "size-4"} fill="currentColor">
          {/* play points LEFT in RTL: the triangle faces the reading direction */}
          <path d="M17 4.5 6.6 12l10.4 7.5z" />
        </svg>
      </span>
      {label}
    </span>
  );
}

/**
 * The house mark: an aperture + crescent — the shadow-play that cinema grew
 * from (خيال الظل) and the light the archive projects.
 */
export function Wordmark({ withLatin = true, className }: { withLatin?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg viewBox="0 0 40 40" className="size-8 shrink-0" aria-hidden>
        <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--color-bone)" strokeOpacity="0.85" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="11.5" fill="var(--color-tungsten)" />
        <circle cx="25.5" cy="17" r="10.5" fill="var(--color-night)" />
        <circle cx="33" cy="8" r="1.6" fill="var(--color-cinnabar)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-2xl font-bold tracking-0" style={{ letterSpacing: 0 }}>
          خيال
        </span>
        {withLatin && (
          <span className="label-mono mt-1 text-[9px] text-ash">KHAYAL · OPEN FILM ARCHIVE</span>
        )}
      </span>
    </span>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("label-ar text-tungsten", className)}>{children}</p>
  );
}
