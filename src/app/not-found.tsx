import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";

/**
 * A missing page must never be indexed: when the shell has already streamed,
 * the HTTP status can legitimately be 200, so the directive is the guarantee.
 */
export const metadata: Metadata = { title: "Page introuvable — Cléopâtre", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-night text-porcelain">
      <div className="container-lux grid min-h-dvh items-center gap-12 py-16 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="eyebrow mb-6 text-porcelain/50">Erreur 404</p>
            <p className="font-display text-[7rem] italic leading-none text-porcelain/15 sm:text-[10rem]">404</p>
            <h1 className="-mt-6 font-display text-display-lg">Cette page s&apos;est <em className="text-cinabre-3">égarée</em></h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-porcelain/65">Le lien est peut-être ancien, ou le produit n&apos;est plus référencé dans notre sélection. Nos rayons, eux, sont bien ouverts.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/boutique" className="btn-light">Explorer la boutique</Link>
              <Link href="/" className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-porcelain/40 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-porcelain transition-colors hover:border-porcelain hover:bg-porcelain hover:text-night">Retour à l&apos;accueil</Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.15} className="border border-porcelain/15 bg-night-2 p-8 lg:p-10">
          <p className="eyebrow mb-6 text-porcelain/50">Par où continuer ?</p>
          <ul className="divide-y divide-porcelain/10">
            {[
              { h: "/boutique", t: "La boutique complète", d: "Dermo-cosmétique, solaire, cheveux, compléments" },
              { h: "/univers/visage", t: "Univers Visage", d: "Sérums, hydratants, anti-âge" },
              { h: "/univers/solaire", t: "Univers Solaire", d: "Protection SPF 50+ pour toute la famille" },
              { h: "/besoin/peau-sensible", t: "Par besoin", d: "Peau sensible, sèche, imperfections…" },
              { h: "/journal", t: "Le Journal", d: "Conseils de nos pharmaciens" },
            ].map((x) => (
              <li key={x.h}>
                <Link href={x.h} className="group flex items-center justify-between gap-4 py-4">
                  <span><span className="block font-display text-xl text-porcelain transition-colors group-hover:text-cinabre-3">{x.t}</span><span className="mt-0.5 block text-xs text-porcelain/45">{x.d}</span></span>
                  <ArrowRightIcon size={16} className="shrink-0 text-porcelain/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cinabre-3" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
