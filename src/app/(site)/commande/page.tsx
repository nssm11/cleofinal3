import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { enabledPaymentMethods } from "@/lib/payments";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * CHECKOUT — the quietest surface of the house.
 *
 * Apple-like on purpose: one narrow column, one serif sentence, no
 * atmosphere, no decoration competing with the fields. The price is
 * restated at every step, the phone number sits one tap away at the top,
 * and the confirmation is a single, calm press.
 */
export default async function CommandePage() {
  const copy = await getCopy();
  const user = await getCurrentUser();
  const [saved, storeRows] = await Promise.all([
    user
      ? db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault))
      : Promise.resolve([]),
    db.select().from(stores).where(eq(stores.isActive, true)),
  ]);

  return (
    <div className="min-h-dvh bg-porcelain">
      <div className="border-b border-rule/60">
        <div className="container-narrow flex items-center justify-between gap-6 py-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-ash">
            {copy.checkout.review} · Cléopâtre — {copy.checkout.placeOrder}
          </p>
          <a
            href="tel:+21671450210"
            className="hidden text-[9.5px] font-bold uppercase tracking-[0.28em] text-ash transition-colors hover:text-ink sm:block"
          >
            Besoin d&apos;aide ? 71 450 210
          </a>
        </div>
      </div>

      <div className="container-narrow py-14 lg:py-20">
        <p className="eyebrow mb-5">{copy.checkout.review}</p>
        <h1 className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-light tracking-[-0.02em] text-ink">
          Finaliser votre commande
        </h1>
        <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-graphite">
          Paiement à la livraison, virement ou carte en boutique. Vos coordonnées ne sont jamais revendues ni
          utilisées à d&apos;autres fins.
        </p>
        <div className="mt-12">
          <CheckoutFlow user={user} savedAddresses={saved} stores={storeRows} methods={[...enabledPaymentMethods()]} />
        </div>
      </div>
    </div>
  );
}
