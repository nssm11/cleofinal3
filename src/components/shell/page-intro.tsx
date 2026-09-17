import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal, Curtain, MaskLine } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE SEUIL — the threshold of a chapter.
   ──────────────────────────────────────────────────────────────────────────
   Every destination in the house opens the same way: a rule that carries the
   index and the kicker, an oversized Bodoni statement that wipes up from its
   own baseline, a lead paragraph measured to a comfortable line — and, when
   the destination owns an image, a plate offset so the composition leans
   instead of centring.

   Server component: it composes without animating. The reveal primitives
   carry the movement and cost nothing on the client beyond a transform.
   ══════════════════════════════════════════════════════════════════════════ */

export function PageIntro({
  kicker,
  index,
  title,
  intro,
  breadcrumbs,
  image,
  imageAlt,
  imagePriority = false,
  right,
  children,
  className,
  tone = "paper",
  rail,
}: {
  kicker?: string;
  index?: string;
  title: ReactNode;
  intro?: ReactNode;
  breadcrumbs?: { href?: string; label: string }[];
  image?: string | null;
  imageAlt?: string;
  imagePriority?: boolean;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: "paper" | "cream" | "noir";
  /** Optional vertical label for the far-left rail. */
  rail?: string;
}) {
  const dark = tone === "noir";
  return (
    <section className={cn("relative overflow-hidden", dark ? "bg-obsidian text-alabaster" : "bg-porcelain")}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {dark ? <div className="night-field" /> : <div className="light-field" />}
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(17,17,19,0.045)_0_1px,transparent_1px_8.3333%)]" />
        <div className="grain absolute inset-0" />
      </div>

      <div className={cn("relative container-wide", className ?? "pb-10 pt-24 lg:pb-16 lg:pt-28")}>
        {breadcrumbs && (
          <div className="mb-8">
            <Breadcrumbs items={breadcrumbs} light={dark} />
          </div>
        )}

        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-10">
          {rail && (
            <div className="hidden lg:col-span-1 lg:block">
              <span className="rail-label block pb-2">{rail}</span>
            </div>
          )}

          <div className={cn(image || right ? "lg:col-span-7" : rail ? "lg:col-span-11" : "lg:col-span-10")}>
            <Reveal y={12} amount={0.1} className="mb-7 flex items-center gap-4 border-b border-rule pb-3.5">
              <span aria-hidden className="h-px w-6 bg-cinabre" />
              {index && <span className="num text-[0.6875rem] text-cinabre">{index}</span>}
              {kicker && <span className={cn("micro", dark ? "text-alabaster/70" : "text-graphite")}>{kicker}</span>}
            </Reveal>

            <h1
              className={cn(
                "font-display text-[clamp(2.6rem,6.4vw,5.6rem)] leading-[0.92] tracking-[-0.035em] text-balance",
                dark ? "text-alabaster" : "text-ink",
              )}
            >
              <MaskLine>{title}</MaskLine>
            </h1>

            {intro && (
              <Reveal y={16} delay={0.12}>
                <p
                  className={cn(
                    "mt-6 max-w-[38rem] text-[1.0625rem] leading-[1.72]",
                    dark ? "text-alabaster/70" : "text-graphite",
                  )}
                >
                  {intro}
                </p>
              </Reveal>
            )}

            {right && (
              <Reveal y={16} delay={0.18} className="mt-8 flex flex-wrap items-center gap-6">
                {right}
              </Reveal>
            )}
          </div>

          {image && (
            <div className="relative lg:col-span-5">
              <Curtain className="relative aspect-[4/3] w-full lg:aspect-[5/4]" from="bottom">
                <div className="absolute inset-0 overflow-hidden bg-bone-2">
                  <Image
                    src={image}
                    alt={imageAlt ?? ""}
                    fill
                    priority={imagePriority}
                    sizes="(max-width:1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                </div>
              </Curtain>
              {/* The instrument's mark, breaking the frame on purpose. */}
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-3 -start-3 hidden h-20 w-20 border lg:block",
                  dark ? "border-alabaster/20 bg-night-2" : "border-rule-strong bg-porcelain",
                )}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-cinabre" />
              </span>
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
