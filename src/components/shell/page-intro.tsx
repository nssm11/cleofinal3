import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal, Curtain } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * LE SEUIL — the threshold of a chapter.
 *
 * Every destination in the house opens the same way: a rail label on the far
 * left, an oversized statement that runs past its own column, and — when the
 * destination owns an image — a photographic plate that is deliberately offset
 * so the composition is asymmetric rather than centred.
 *
 * Server component: it composes without animating; the reveal primitives carry
 * the movement and cost nothing on the client beyond a transform.
 */
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
    <section className={cn("relative overflow-hidden", dark ? "bg-carbon text-chalk" : "bg-canvas")}>
      {/* The room behind the chapter */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn("dispensary absolute inset-0", dark ? "opacity-25" : "opacity-70")} />
        <div className="grain absolute inset-0" />
        <div
          aria-hidden
          className={cn("absolute inset-x-0 bottom-0 h-px", dark ? "bg-night-line" : "bg-line")}
        />
      </div>

      <div className={cn("relative shell-wide", className ?? "pb-9 pt-24 lg:pb-14 lg:pt-28")}>
        {breadcrumbs && (
          <div className="mb-7">
            <Breadcrumbs items={breadcrumbs} light={dark} />
          </div>
        )}

        <div className="grid items-end gap-9 lg:grid-cols-12 lg:gap-10">
          {rail && (
            <div className="hidden lg:col-span-1 lg:block">
              <span className={cn("rail-label block pb-2")}>{rail}</span>
            </div>
          )}

          <div className={cn(image || right ? "lg:col-span-7" : rail ? "lg:col-span-11" : "lg:col-span-9")}>
            <Reveal y={14} amount={0.1}>
              {(kicker || index) && (
                <p className={cn("mb-5 flex items-baseline gap-5", dark && "text-chalk/60")}>
                  {index && (
                    <span
                      className={cn(
                        "font-sans text-[clamp(1.5rem,2.6vw,2.4rem)] italic leading-none",
                        dark ? "text-iodine-deep/80" : "text-iodine",
                      )}
                    >
                      {index}
                    </span>
                  )}
                  {kicker && <span className="kicker">{kicker}</span>}
                </p>
              )}
              <h1
                className={cn(
                  "font-sans text-[clamp(2.6rem,6.2vw,5.4rem)] leading-[0.94] tracking-[-0.028em]",
                  dark ? "text-chalk" : "text-carbon",
                )}
              >
                {title}
              </h1>
              {intro && (
                <p
                  className={cn(
                    "mt-5 max-w-[38rem] text-[15px] leading-[1.8]",
                    dark ? "text-chalk/65" : "text-muted",
                  )}
                >
                  {intro}
                </p>
              )}
            </Reveal>
            {right && <div className="mt-7 flex flex-wrap items-center gap-5">{right}</div>}
          </div>

          {image && (
            <div className="relative lg:col-span-5">
              <Curtain className="relative aspect-[4/3] w-full lg:aspect-[5/4]" from="bottom">
                <div className="absolute inset-0 overflow-hidden bg-canvas-2">
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
              {/* The offset — a second plate, small, breaking the frame. */}
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-3.5 -left-3.5 hidden h-20 w-20 border lg:block",
                  dark ? "border-line/20 bg-petrol-2" : "border-line-strong/40 bg-porcelain",
                )}
              />
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
