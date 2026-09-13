import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MaskLine, Reveal } from "@/components/motion/reveal";

/**
 * HM · PAR BESOIN — the honest index.
 *
 * A pinned question on the left; on the right, every concern the house
 * answers, as lines of type that warm under the hand. The diagnostic is the
 * door for those who don't know which line is theirs.
 */
export function Besoins({
  concerns,
  copy,
}: {
  concerns: { id: number; slug: string; name: string; intro: string | null }[];
  copy: {
    eyebrow: string;
    title1: string;
    title2: string;
    text: string;
    cta: string;
  };
}) {
  if (concerns.length === 0) return null;
  return (
    <section aria-label={copy.eyebrow} className="relative">
      <div className="container-wide grid gap-12 py-20 lg:grid-cols-12 lg:gap-14 lg:py-32">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <p className="hm-kicker text-muted">{copy.eyebrow}</p>
            </Reveal>
            <h2 className="hm-display mt-6 text-[clamp(2.1rem,4.6vw,3.6rem)] text-ink">
              <MaskLine immediate={false}>{copy.title1}</MaskLine>
              <MaskLine immediate={false} delay={0.1} className="italic text-champagne-2">
                {copy.title2}
              </MaskLine>
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-sm text-[14.5px] leading-[1.85] text-muted">{copy.text}</p>
              <Link href="/diagnostic" className="btn-ghost mt-8">
                {copy.cta} <ArrowRightIcon size={13} className="rtl-mirror" />
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ul className="border-t border-stone/60">
            {concerns.map((c, i) => (
              <Reveal key={c.id} as="li" y={10} delay={Math.min(i * 0.03, 0.24)} className="border-b border-stone/60">
                <Link href={`/besoin/${c.slug}`} className="group relative flex items-center gap-5 overflow-hidden py-5 sm:gap-7">
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-champagne-soft/60 to-transparent transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 rtl:origin-right"
                  />
                  <span className="relative w-8 shrink-0 font-display text-[13px] italic text-champagne-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block font-display text-[clamp(1.35rem,2.4vw,1.9rem)] leading-tight text-ink transition-all duration-500 group-hover:translate-x-2 group-hover:text-champagne-2 rtl:group-hover:-translate-x-2">
                      {c.name}
                    </span>
                    {c.intro && <span className="mt-1.5 block truncate text-[13.5px] text-muted">{c.intro}</span>}
                  </span>
                  <ArrowRightIcon
                    size={18}
                    className="relative shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-ink rtl-mirror"
                  />
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
