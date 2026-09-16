import type { ProductCard } from "@/lib/catalog";
import { Reveal } from "@/components/motion/reveal";
import { Curtain } from "@/components/motion/reveal";
import { VisageCard } from "./VisageCard";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

/**
 * LE GESTE PREMIER — one product, set like a front page.
 *
 * The house's own counter pick opens the commerce of the night: a great
 * plate beside a caption that reads like a headline, then three quieter
 * gestures on the shelf beneath. No grid of equals — a hierarchy.
 */
export function FeaturedRitual({
  lead,
  supports,
  wishedIds,
  isAuthed,
}: {
  lead: ProductCard;
  supports: ProductCard[];
  wishedIds: number[];
  isAuthed: boolean;
}) {
  const ed = VISAGE_EDITION.ritual;
  return (
    <section id="rituel" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <div className="container-wide py-16 lg:py-24">
        <Reveal amount={0.1}>
          <p className="mb-12 flex items-baseline gap-5 lg:mb-16">
            <span className="font-display text-[15px] italic leading-none text-cine-gold">01</span>
            <span className={NOIR_EYEBROW}>{ed.kicker}</span>
            <span aria-hidden className="ml-2 hidden h-px flex-1 bg-cine-line sm:block" />
          </p>
        </Reveal>

        <Curtain from="bottom">
          <VisageCard p={lead} variant="feature" priority wished={wishedIds.includes(lead.id)} isAuthed={isAuthed} />
        </Curtain>

        {supports.length > 0 && (
          <div className="mt-16 lg:mt-20">
            <Reveal amount={0.1}>
              <p className="mb-8 flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.26em] text-cine-faint">
                {ed.shelf}
                <span aria-hidden className="h-px flex-1 bg-cine-line" />
              </p>
            </Reveal>
            <div className="grid gap-x-10 gap-y-9 sm:grid-cols-3">
              {supports.map((p, i) => (
                <Reveal key={p.id} y={12} delay={i * 0.06}>
                  <VisageCard p={p} variant="leaf" wished={wishedIds.includes(p.id)} isAuthed={isAuthed} showCompare={false} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
