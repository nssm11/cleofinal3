import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function FeatureHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line/70 bg-canvas pb-12 pt-28 lg:pb-16 lg:pt-36">
      <div aria-hidden className="dispensary absolute inset-0 opacity-35" />
      <div className="relative shell-wide">
        <p className="kicker mb-5 text-iodine-deep">{eyebrow}</p>
        <h1 className="max-w-4xl font-ant uppercase text-[clamp(2.25rem,5.4vw,4.8rem)] leading-[0.92] tracking-[-0.035em] text-carbon">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.9] text-muted">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function FeatureGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function FeatureCard({
  title,
  eyebrow,
  description,
  href,
  badge,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  href?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
}) {
  const body = (
    <article className={cn("group relative h-full border border-line/70 bg-porcelain p-5 transition-colors hover:border-iodine-deep/50", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="kicker-xs mb-3 text-faint">{eyebrow}</p>}
          <h2 className="font-ant uppercase text-[1.35rem] leading-tight text-carbon">{title}</h2>
        </div>
        {badge && <Badge tone="accent">{badge}</Badge>}
      </div>
      {description && <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
      {href && (
        <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-iodine-deep">
          Ouvrir <ArrowRightIcon size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </article>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function MetricStrip({ items }: { items: { label: string; value: ReactNode; hint?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="border border-line/60 bg-canvas px-5 py-4">
          <p className="kicker-xs text-faint">{item.label}</p>
          <p className="mt-2 font-ant uppercase text-[1.8rem] leading-none text-carbon">{item.value}</p>
          {item.hint && <p className="mt-1 text-[12px] text-muted">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
