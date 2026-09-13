import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";

/**
 * HM · LE COMPTOIR, EN LIGNE — utility as a hairline index.
 *
 * Four services, one quiet band: no boxes, no icon grid. A ledger the eye
 * scans in a breath, on the way to the footer.
 */
export function ServicesBand({
  copy,
}: {
  copy: {
    index: string;
    title1: string;
    title2: string;
    text: string;
    items: { t: string; d: string; href: string; cta: string }[];
  };
}) {
  return (
    <section aria-label={copy.index} className="relative border-y border-stone/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(238,226,201,0.4) 50%, transparent 100%)" }}
        />
      </div>
      <div className="relative container-wide grid gap-10 py-14 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="hm-kicker text-muted">{copy.index}</p>
            <h2 className="hm-display mt-5 text-[clamp(1.7rem,3vw,2.5rem)] text-ink">
              {copy.title1}
              <br />
              <span className="italic text-champagne-2">{copy.title2}</span>
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-[1.8] text-muted">{copy.text}</p>
          </Reveal>
        </div>
        <ul className="grid sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
          {copy.items.map((x, i) => (
            <Reveal
              as="li"
              key={x.href}
              y={12}
              delay={i * 0.06}
              className="border-stone/60 max-lg:border-t max-lg:py-5 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0 max-lg:first:border-t-0 max-lg:first:pt-0"
            >
              <Link href={x.href} className="group flex h-full flex-col">
                <span className="font-display text-[13px] italic text-champagne-2">0{i + 1}</span>
                <span className="mt-2 font-display text-[19px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                  {x.t}
                </span>
                <span className="mt-2 text-[12.5px] leading-relaxed text-muted">{x.d}</span>
                <span className="mt-auto flex items-center gap-2 pt-4 text-[9.5px] font-bold uppercase tracking-[0.2em] text-charcoal">
                  {x.cta}
                  <ArrowRightIcon size={12} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
