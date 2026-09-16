import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { fmt } from "@/lib/i18n/config";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

/**
 * TOUT LE RAYON — the door to the whole shelf, set as a sentence.
 *
 * Where the old page parked a button, the nocturne sets the count itself
 * in display type: the number is the invitation, the underline is the
 * handle. One gesture opens every reference the universe owns.
 */
export function DiscoveryGateway({ total, label }: { total: number; label: string }) {
  const ed = VISAGE_EDITION.gateway;
  return (
    <section id="rayon" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <div className="container-wide grid gap-12 py-24 lg:grid-cols-12 lg:gap-10 lg:py-36">
        <div className="lg:col-span-7">
          <Reveal amount={0.1}>
            <p className={`${NOIR_EYEBROW} mb-8 flex items-center gap-4`}>
              <span aria-hidden className="h-px w-10 bg-cine-gold/60" />
              {ed.kicker}
            </p>
          </Reveal>
          <h2 className="font-display font-light leading-[1.0] tracking-[-0.02em] text-cine-ivory">
            <span className="block overflow-hidden pb-[0.06em]">
              <MaskLine className="text-[clamp(2.4rem,6vw,4.8rem)]">
                {ed.lead[0]} <span className="italic text-cine-gold">{total}</span>
              </MaskLine>
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <MaskLine delay={0.08} className="text-[clamp(2.4rem,6vw,4.8rem)]">
                {ed.lead[1]}
              </MaskLine>
            </span>
          </h2>
        </div>

        <div className="flex flex-col justify-end gap-9 lg:col-span-4 lg:col-start-9">
          <Reveal y={14} delay={0.1}>
            <p className="text-[13.5px] leading-[1.9] text-cine-mist">{ed.body}</p>
          </Reveal>
          <Reveal y={14} delay={0.16}>
            <Link
              href="?all=1#rayon"
              className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-cine-line pb-3 font-display text-[clamp(1.2rem,2.4vw,1.9rem)] italic leading-tight text-cine-ivory transition-colors duration-500 hover:border-cine-gold hover:text-cine-gold"
            >
              {fmt(label, { n: total })}
              <ArrowRightIcon
                size={20}
                strokeWidth={1.25}
                className="translate-y-[2px] shrink-0 transition-transform duration-500 group-hover:translate-x-1.5 rtl-mirror"
              />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
