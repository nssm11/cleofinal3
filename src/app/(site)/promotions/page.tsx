import type { Metadata } from "next";
import { Suspense } from "react";
import { and, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { promotions } from "@/db/schema";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { OfferGrid } from "@/components/offers/offers";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Offres & promotions",
  description: "Prix justes et codes promo réels sur vos soins essentiels chez Cléopâtre, à Ezzahra et Hammam-Lif.",
  alternates: { canonical: "/promotions" },
};
export const dynamic = "force-dynamic";

/**
 * THE CAMPAIGN — every commitment written down, every clock ticking.
 *
 * The hero states the method in one breath; the codes follow as cards —
 * each with its exact conditions, a copy gesture, and its own live
 * countdown when the offer ends. The discounted references close the page
 * as evidence. Same data as ever (active promotions + the promo shelf);
 * only the telling is new.
 */
export default async function PromotionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [codes, locale] = await Promise.all([
    db
      .select()
      .from(promotions)
      .where(and(eq(promotions.isActive, true), or(isNull(promotions.endsAt), gte(promotions.endsAt, new Date())))),
    getLocale(),
  ]);
  const ar = locale === "tn-arab";

  return (
    <div>
      <section className="relative overflow-hidden bg-night text-porcelain">
        <MotifLayer motif="precision" light={[72, 14]} />
        <div className="relative container-wide py-14 lg:py-20">
          <Reveal y={14} amount={0.1}>
            <p className="rule-label text-cinabre-3/80">{ar ? "الحملة" : "La campagne"}</p>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <h1 className="max-w-2xl font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.02] tracking-[-0.024em] text-porcelain">
                {ar ? (
                  <>أسعار عادلة، بدون حيل.</>
                ) : (
                  <>
                    Prix justes, <span className="italic text-cinabre-3">sans artifice.</span>
                  </>
                )}
              </h1>
              <p className="max-w-md pb-1 text-[13.5px] leading-[1.8] text-porcelain/65">
                {ar
                  ? "لا تخفيضات وهمية. الشروط مكتوبة بوضوح، والعدّاد يشتغل بالثانية."
                  : "Pas de fausses remises ni de prix gonflés la veille. Les conditions sont écrites noir sur blanc — et le compte à rebours tourne à la seconde."}
              </p>
            </div>
          </Reveal>

          <Reveal y={16} delay={0.08} amount={0.05} className="mt-10 lg:mt-12">
            {codes.length > 0 ? (
              <OfferGrid
                dark
                offers={codes.map((p) => ({
                  id: p.id,
                  code: p.code,
                  label: p.label,
                  type: p.type,
                  value: p.value,
                  minSubtotalMillimes: p.minSubtotalMillimes,
                  endsAt: p.endsAt,
                }))}
              />
            ) : (
              <p className="border border-dashed border-porcelain/20 px-6 py-8 text-center text-[13.5px] text-porcelain/60">
                {ar ? "لا توجد رموز حالياً — التخفيضات على المنتجات بالأسفل." : "Aucun code en ce moment — les remises produits sont juste en dessous."}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* The three gestures — a quiet method, stated once */}
      <section className="relative overflow-hidden border-b border-rule/70 bg-bone">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-40" />
        </div>
        <div className="relative container-wide grid gap-px bg-rule-strong/20 sm:grid-cols-3">
          {[
            { n: "01", t: ar ? "لاحظ" : "Repérez", d: ar ? "التخفيض معروض على صفحة المنتج. لا حسابات." : "La remise est déjà affichée sur la fiche du produit. Aucun calcul à faire." },
            { n: "02", t: ar ? "أدخل الرمز" : "Saisissez le code", d: ar ? "في مرحلة الدفع، في الخانة المخصصة." : "À l'étape paiement, dans le champ prévu. La remise s'applique aussitôt." },
            { n: "03", t: ar ? "استلم" : "Recevez", d: ar ? "توصيل 24–72 ساعة في كامل تونس، أو استلام من المتجر." : "Livraison 24–72 h partout en Tunisie, ou retrait en boutique sous deux heures." },
          ].map((s, i) => (
            <Reveal key={s.n} y={12} delay={i * 0.06} className="bg-bone px-7 py-8 lg:px-9">
              <p className="font-display text-[clamp(1.5rem,2.4vw,2rem)] italic leading-none text-cinabre-2">{s.n}</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">{s.t}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-graphite">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="container-wide py-rhythm lg:py-rhythm-lg">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ promo: true }} sp={sp} basePath="/promotions" />
        </Suspense>
      </div>
    </div>
  );
}
