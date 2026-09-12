import type { Metadata } from "next";
import Link from "next/link";
import { CartPage } from "@/components/checkout/cart-page";
import { Steps } from "@/components/ui/primitives";
import { MotifLayer } from "@/components/shell/motif";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

/**
 * Deliberately the plainest page of the shop. No atmosphere beyond a hairline
 * grid, no promotional aside — the visitor has already chosen, and the page's
 * only job is to show the choices back clearly.
 */
export default async function PanierPage() {
  const copy = await getCopy();
  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-stone/70 bg-paper pb-10 pt-28 lg:pb-12 lg:pt-36">
        <MotifLayer motif="precision" light={[88, 10]} />
        <div className="relative container-wide">
          <Steps steps={[copy.cart.title, copy.checkout.delivery, copy.checkout.payment, copy.tracking.statuses.confirmed]} current={0} />
          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="rule-label mb-5">{copy.cart.title}</p>
              <h1 className="font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-[1] tracking-[-0.026em] text-ink">
                {copy.cart.title}{" "}
                <span className="italic text-champagne-2">{copy.checkout.review.toLowerCase()}</span>
              </h1>
            </div>
            <p className="max-w-md text-[13.5px] leading-[1.85] text-muted lg:col-span-5">
              Vérifiez les quantités, ajoutez un mot pour l&apos;équipe si besoin — le règlement n&apos;intervient
              qu&apos;à la dernière étape.
            </p>
          </div>
        </div>
      </section>

      <div className="container-wide py-rhythm lg:py-rhythm-lg">
        <CartPage />
      </div>

      <div className="container-wide border-t border-stone/70 py-10">
        <p className="text-[12.5px] text-muted">
          Un doute sur un produit ?{" "}
          <a href="tel:+21671450210" className="link-underline text-charcoal">
            Appelez le 71 450 210
          </a>{" "}
          — ou{" "}
          <Link href="/aide" className="link-underline text-charcoal">
            consultez l&apos;aide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
