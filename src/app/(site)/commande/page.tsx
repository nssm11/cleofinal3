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
 * LA CAISSE — the quietest surface of the house.
 *
 * One narrow column. No atmosphere, no decoration competing with the fields.
 * The house rules are stated once, the phone number sits one tap away, and the
 * price is restated at every step. The logic below is untouched — same saved
 * addresses, same active stores, same enabled payment methods.
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
    <div className="min-h-dvh bg-canvas">
      <div className="rule-b">
        <div className="shell-narrow flex items-center justify-between gap-6 py-5">
          <p className="kicker-xs">
            {copy.checkout.review} — {copy.checkout.placeOrder}
          </p>
          <a
            href="tel:+21671450210"
            className="kicker-xs hidden transition-colors hover:text-carbon sm:block"
          >
            Besoin d&apos;aide ? 71 450 210
          </a>
        </div>
      </div>

      <div className="shell-narrow pb-block pt-12 lg:pt-16">
        <span className="kicker">Étape finale</span>
        <h1 className="mt-4 font-ant text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.9] text-carbon">
          Finaliser la commande
        </h1>
        <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-steel">
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
