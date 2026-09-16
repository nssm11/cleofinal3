import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

/**
 * LE CONSEIL — the pharmacy's quiet promise, set as its own scene.
 *
 * The old floating sentence becomes a moment of the night: a dark room,
 * one label, one sentence, and the house's own invitation to /diagnostic.
 */
export function ConseilNoir({ askAdvice }: { askAdvice: string }) {
  const ed = VISAGE_EDITION.conseil;
  return (
    <section
      id="conseil"
      className="relative scroll-mt-20 overflow-hidden border-t border-cine-line bg-cine-noir"
    >
      {/* A single warm glow, high in the dark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(64%_100%_at_50%_0%,rgba(201,168,106,0.13),transparent_70%)]"
      />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-50" />

      <div className="container-wide relative grid gap-12 py-24 lg:grid-cols-12 lg:py-36">
        <div className="lg:col-span-3">
          <Reveal amount={0.1}>
            <p className={`${NOIR_EYEBROW} flex items-center gap-4`}>
              <span aria-hidden className="h-px w-10 bg-cine-gold/60" />
              {ed.kicker}
            </p>
          </Reveal>
        </div>
        <div className="lg:col-span-8">
          <h2 className="font-display font-light leading-[1.02] tracking-[-0.02em] text-cine-ivory">
            <MaskLine className="text-[clamp(2.2rem,5vw,4.2rem)]">{ed.title[0]}</MaskLine>
            <MaskLine delay={0.08} className="text-[clamp(2.2rem,5vw,4.2rem)] italic text-cine-gold">
              {ed.title[1]}
            </MaskLine>
          </h2>
          <Reveal y={14} delay={0.12}>
            <p className="mt-8 max-w-lg text-[14px] leading-[1.95] text-cine-mist">
              <span className="font-display text-[17px] italic text-cine-ivory">{ed.lead}</span>{" "}
              {ed.body}
            </p>
          </Reveal>
          <Reveal y={14} delay={0.2}>
            <p className="mt-11 flex flex-wrap items-center gap-x-10 gap-y-4">
              <Link href="/diagnostic" className="cine-cta" aria-label={askAdvice}>
                {ed.cta}
                <ArrowRightIcon size={13} className="rtl-mirror" aria-hidden />
              </Link>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-cine-faint">
                71 450 210 · Ezzahra — Hammam-Lif
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
