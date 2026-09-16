import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/catalog";
import { ArrowRightIcon } from "@/components/icons";
import { Curtain, MaskLine, Reveal } from "@/components/motion/reveal";
import { VisageCard } from "./VisageCard";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

/**
 * L'ÉDITORIAL — the nocturne reads like a magazine for one plate.
 *
 * The universe's own photograph hangs tall on the right, breathing slowly;
 * the story is set to its left in ivory, and the two products the story is
 * really about wait on a ledge beneath the words. The last line is a door
 * back into the filtered shelf.
 */
export function EditorialMoment({
  image,
  picks,
  concernSlug,
  wishedIds,
  isAuthed,
}: {
  image: string;
  picks: ProductCard[];
  concernSlug: string | null;
  wishedIds: number[];
  isAuthed: boolean;
}) {
  const ed = VISAGE_EDITION.editorial;
  return (
    <section id="edito" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <div className="container-wide grid gap-14 py-24 lg:grid-cols-12 lg:gap-12 lg:py-32">
        {/* The portrait — the room's own photograph, breathing. */}
        <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <Curtain from="bottom">
            <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:h-[600px]">
              <Image
                src={image}
                alt="Le geste du soir — une cliente applique son soin"
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="visage-breathe object-cover"
              />
              <div aria-hidden className="grain absolute inset-0 opacity-60" />
              <p className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-cine-noir/55 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.26em] text-cine-mist backdrop-blur-sm">
                <span>{ed.kicker} — {ed.caption}</span>
                <span aria-hidden className="h-px w-8 bg-cine-gold/70" />
              </p>
            </div>
          </Curtain>
        </div>

        {/* The story — set against the plain dark, never on the light. */}
        <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
          <Reveal amount={0.1}>
            <p className={`${NOIR_EYEBROW} mb-7 flex items-center gap-4`}>
              <span className="font-display text-[13px] italic normal-case tracking-normal text-cine-gold">03</span>
              <span aria-hidden className="h-px w-10 bg-cine-gold/60" />
              {ed.kicker}
            </p>
          </Reveal>
          <h2 className="font-display font-light text-cine-ivory">
            <MaskLine className="text-[clamp(2.1rem,4vw,3.4rem)] italic leading-[1.06] tracking-[-0.015em]">
              {ed.title}
            </MaskLine>
          </h2>
          <Reveal y={14} delay={0.1}>
            <p className="mt-7 max-w-md text-[14px] leading-[1.95] text-cine-mist">{ed.body}</p>
          </Reveal>

          {picks.length > 0 && (
            <div className="mt-11 grid max-w-xl gap-8">
              {picks.map((p, i) => (
                <Reveal key={p.id} y={12} delay={0.12 + i * 0.08}>
                  <VisageCard p={p} variant="leaf" wished={wishedIds.includes(p.id)} isAuthed={isAuthed} showCompare={false} />
                </Reveal>
              ))}
            </div>
          )}

          {concernSlug && (
            <Reveal y={12} delay={0.24}>
              <Link
                href={`?concerns=${encodeURIComponent(concernSlug)}#rayon`}
                className="cine-cta mt-11 inline-flex self-start"
              >
                {ed.cta}
                <ArrowRightIcon size={13} className="rtl-mirror" aria-hidden />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
