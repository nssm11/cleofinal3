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
      <section className="border-b border-stone/60 bg-paper pb-10 pt-28 lg:pb-12 lg:pt-36">
        <div className="container-wide flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-5">
              {copy.cart.title} — {copy.checkout.review.toLowerCase()}
            </p>
            <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.4rem)] font-light leading-[1] tracking-[-0.02em] text-ink">
              Votre sac
            </h1>
          </div>
          <p className="max-w-md text-[13.5px] leading-[1.85] text-muted">
            Vérifiez les quantités, ajoutez un mot pour l&apos;équipe si besoin — le règlement n&apos;intervient
            qu&apos;à la dernière étape.
          </p>
        </div>
      </section>

      <div className="container-wide py-14 lg:py-20">
        <CartPage />
      </div>

      <div className="container-wide border-t border-stone/60 py-10">
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
