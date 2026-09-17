import type { Metadata } from "next";
import Link from "next/link";
import { CartPage } from "@/components/checkout/cart-page";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Votre sac", robots: { index: false } };

/**
 * VOTRE SAC — the bag, opened on a table.
 *
 * One serif line announces what is inside; the pieces lie in a long, quiet
 * row, and the tally stands to the right like a note pinned to the bag.
 * Nothing here shouts. The checkout is one breath away.
 */
export default async function PanierPage() {
  const copy = await getCopy();
  return (
    <div>
      <section className="border-b border-rule/60 bg-porcelain py-8 lg:py-10">
        <div className="container-wide flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-5">
              {copy.cart.title} — {copy.checkout.review.toLowerCase()}
            </p>
            <h1 className="font-display text-[clamp(1.8rem,3.8vw,2.6rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
              Votre sac
            </h1>
          </div>
          <p className="max-w-md text-[13.5px] leading-[1.85] text-graphite">
            Vérifiez les quantités, ajoutez un mot pour l&apos;équipe si besoin — le règlement n&apos;intervient
            qu&apos;à la dernière étape.
          </p>
        </div>
      </section>

      <div className="container-wide py-10 lg:py-12">
        <CartPage />
      </div>

      <div className="container-wide border-t border-rule/60 py-10">
        <p className="text-[12.5px] text-graphite">
          Un doute sur un produit ?{" "}
          <a href="tel:+21671450210" className="link-underline text-slate">
            Appelez le 71 450 210
          </a>{" "}
          — ou{" "}
          <Link href="/aide" className="link-underline text-slate">
            consultez l&apos;aide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
