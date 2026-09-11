import type { Metadata } from "next";
import { Suspense } from "react";
import { and, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { promotions } from "@/db/schema";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { formatDTShort } from "@/lib/money";

export const metadata: Metadata = {
  title: "Offres & promotions",
  description: "Prix justes et codes promo réels sur vos soins essentiels chez Cléopâtre, à Ezzahra et Hammam-Lif.",
  alternates: { canonical: "/promotions" },
};
export const dynamic = "force-dynamic";

/**
 * THE CAMPAIGN.
 *
 * An offer page should read like a written commitment, not like a banner sale:
 * the codes are set as large type with their exact conditions beneath, and the
 * discounted references follow as evidence.
 */
export default async function PromotionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const codes = await db
    .select()
    .from(promotions)
    .where(and(eq(promotions.isActive, true), or(isNull(promotions.endsAt), gte(promotions.endsAt, new Date()))));

  return (
    <div>
      <section className="relative overflow-hidden bg-noir text-paper">
        <MotifLayer motif="precision" light={[72, 14]} />
        <div className="relative container-wide grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-6">
            <Reveal y={14} amount={0.1}>
              <p className="rule-label mb-8 text-champagne-3/80">La campagne</p>
              <h1 className="font-display text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[0.96] tracking-[-0.028em] text-paper">
                Prix justes,
                <br />
                <span className="italic text-champagne-3">sans artifice.</span>
              </h1>
              <p className="mt-8 max-w-lg text-[15px] leading-[1.85] text-paper/65">
                Pas de fausses remises ni de prix gonflés la veille. Les offres ci-dessous portent sur des références
                que nous conseillons toute l&apos;année, avec des conditions écrites noir sur blanc.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal y={14} delay={0.1}>
              <p className="eyebrow mb-6 text-paper/40">Les codes en cours</p>
              <ul className="border-t border-paper/12">
                {codes.map((p, i) => (
                  <li key={p.id} className="border-b border-paper/12 py-5">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-[12px] italic text-champagne-3/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <code className="font-display text-[24px] tracking-[0.03em] text-champagne-3">{p.code}</code>
                    </div>
                    <p className="mt-2 pl-8 text-[13.5px] text-paper/70">{p.label}</p>
                    <p className="mt-1.5 pl-8 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/35">
                      {p.minSubtotalMillimes > 0 && <>dès {formatDTShort(p.minSubtotalMillimes)} · </>}
                      {p.endsAt
                        ? `jusqu'au ${new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "long" }).format(p.endsAt)}`
                        : "offre permanente"}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The three gestures — a quiet method, stated once */}
      <section className="relative overflow-hidden border-b border-stone/70 bg-cream">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-40" />
        </div>
        <div className="relative container-wide grid gap-px bg-stone-2/20 sm:grid-cols-3">
          {[
            { n: "01", t: "Repérez", d: "La remise est déjà affichée sur la fiche du produit. Aucun calcul à faire." },
            { n: "02", t: "Saisissez le code", d: "À l'étape paiement, dans le champ prévu. La remise s'applique aussitôt." },
            { n: "03", t: "Recevez", d: "Livraison 24–72 h partout en Tunisie, ou retrait en boutique sous deux heures." },
          ].map((s, i) => (
            <Reveal key={s.n} y={12} delay={i * 0.06} className="bg-cream px-7 py-9 lg:px-9">
              <p className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] italic leading-none text-champagne-2">{s.n}</p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">{s.t}</p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="container-wide py-14 lg:py-20">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ promo: true }} sp={sp} basePath="/promotions" />
        </Suspense>
      </div>
    </div>
  );
}
