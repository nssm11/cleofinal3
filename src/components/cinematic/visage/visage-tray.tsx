import Link from "next/link";
import { Children, isValidElement, type ReactNode } from "react";
import { PhoneIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";

/**
 * THE CENSUS — the chapter's à-la-carte index.
 *
 * Visage is a room of *gestures* more than of boxes. Every category of the
 * room is one entry of the census: a chapter numeral, its name set wide in
 * the display face, and a single hairline that warms on approach. The four
 * or six categories sit side by side as a right-read index instead of a
 * vertical stack of cards. Below, a quiet table of memoranda records why
 * the room is arranged this way and how to reach a pharmacist.
 */

export function VisageTray({ children }: { children: ReactNode }) {
  const count = Children.toArray(children).filter((c) => isValidElement(c)).length;
  return (
    <section aria-labelledby="visage-census" className="border-b border-stone/60 bg-paper">
      <div className="container-wide py-14 lg:py-20">
        <Reveal>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="rule-label mb-5">Le déroulé du visage</p>
              <h2 id="visage-census" className="font-display text-[clamp(1.7rem,3.2vw,2.6rem)] font-light leading-[1.05] text-ink">
                Les {count} gestes du rayon
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-muted">
              Du nettoyage à la correction, chaque catégorie est un geste — et l&apos;ordre entre eux est ce qui fait tenir la peau.
            </p>
          </div>
        </Reveal>

        <Reveal y={16}>
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

/** One entry of the census — a link, not a box. */
export function VisageTrayItem({ index, title, slug }: { index: string; title: string; slug: string }) {
  return (
    <Link href={`/categorie/${slug}`} className="group border-t border-stone/70 pt-6 transition-colors duration-500">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-[13px] italic leading-none text-champagne-2/80">{index}</span>
        <span aria-hidden className="h-px flex-1 self-center bg-stone/50 transition-colors duration-500 group-hover:bg-stone-2" />
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-stone/60 text-muted-2 transition-all duration-500 group-hover:border-champagne-3/60 group-hover:text-champagne-3"
        >
          →
        </span>
      </div>
      <h3 className="mt-5 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-light leading-[1.05] text-ink transition-colors duration-500 group-hover:text-champagne-2">
        {title}
      </h3>
      <span className="mt-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2 transition-colors duration-300 group-hover:text-ink">
        Parcourir
      </span>
    </Link>
  );
}

/** The rota at the foot of the tray — reasons, and the pharmacist. */
export function VisageMemoranda({ phone = "71 450 210" }: { phone?: string }) {
  const rows = [
    { k: "L'ordre", v: "Nettoyer, traiter, hydrater, protéger — jamais l'inverse." },
    { k: "La dose", v: "Trois gouttes suffisent, une noisette hydrate, deux doigts protègent." },
    { k: "Le tempo", v: "Trois semaines avant de juger une formule. La peau parle lentement." },
    { k: "Le doute", v: "Le comptoir tranche : un pharmacien, le jour même." },
  ];
  return (
    <section aria-label="Les mémoranda" className="border-b border-stone/60 bg-cream/50">
      <div className="container-wide py-12 lg:py-16">
        <Reveal>
          <div className="grid gap-x-12 gap-y-9 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="rule-label mb-5">Mémoranda</p>
              <p className="max-w-xs font-display text-[clamp(1.4rem,2.4vw,1.9rem)] font-light italic leading-[1.25] text-charcoal-2">
                La peau est une patiente : elle ne se presse pas, elle se suit.
              </p>
            </div>
            <div className="lg:col-span-8">
              <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {rows.map((r) => (
                  <div key={r.k} className="border-b border-stone/50 pb-4">
                    <dt className="font-display text-[13px] italic text-champagne-2">{r.k}</dt>
                    <dd className="mt-1.5 text-[14px] leading-relaxed text-charcoal">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>

        <Reveal y={12}>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-stone/60 pt-7">
            <p className="text-[13.5px] text-muted">Un doute sur une formule, une texture, un ordre d&apos;application ?</p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`tel:+216${phone.replace(/\s/g, "")}`}
                className="group inline-flex items-center gap-3 text-[13px] text-charcoal transition-colors hover:text-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center border border-stone-2/60 text-champagne-2 transition-colors group-hover:border-champagne-3/70">
                  <PhoneIcon size={13} strokeWidth={1.4} />
                </span>
                {phone}
              </a>
              <Link href="/diagnostic" className="btn-primary">
                Faire le diagnostic
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
