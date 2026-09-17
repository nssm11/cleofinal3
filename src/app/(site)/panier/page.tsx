import type { Metadata } from "next";
import Link from "next/link";
import { CartPage } from "@/components/checkout/cart-page";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Votre sac", robots: { index: false } };

/**
 * LE SAC — the counter slip, before the sale.
 *
 * A ruled opening states what the page is (no hero, no atmosphere): the count
 * on the left, the promise on the right, then the slip itself. Everything the
 * customer needs to trust the total is visible before the first tap.
 */
export default async function PanierPage() {
  const copy = await getCopy();
  return (
    <div className="bg-canvas">
      <section className="rule-b bg-canvas pb-10 pt-28 lg:pb-12 lg:pt-36">
        <div className="shell-wide">
          <div className="flex items-center gap-4">
            <span aria-hidden className="marker bg-iodine" />
            <span className="kicker">
              {copy.cart.title} — {copy.checkout.review}
            </span>
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-8">
            <h1 className="lg:col-span-7 font-ant text-[clamp(2.4rem,7vw,5.5rem)] uppercase leading-[0.88] text-carbon">
              Votre sac
            </h1>
            <p className="max-w-[48ch] self-end text-lead text-steel lg:col-span-5">
              Vérifiez les quantités, ajoutez un mot pour l&apos;équipe si besoin — le règlement n&apos;intervient
              qu&apos;à la dernière étape, et rien n&apos;est prélevé avant votre confirmation.
            </p>
          </div>
        </div>
      </section>

      <div className="shell-wide py-block lg:py-block-lg">
        <CartPage />
      </div>

      <div className="rule-t">
        <div className="shell-wide flex flex-wrap items-center justify-between gap-4 py-8">
          <p className="kicker-xs">Une question sur une référence ?</p>
          <p className="text-[0.8125rem] text-steel">
            <a href="tel:+21671450210" className="link-underline text-carbon">
              Appelez le 71 450 210
            </a>{" "}
            — ou{" "}
            <Link href="/aide" className="link-underline text-carbon">
              consultez l&apos;aide
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
