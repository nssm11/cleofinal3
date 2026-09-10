import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * CHECKOUT IS QUIETER ON PURPOSE.
 *
 * Every other surface of the house is allowed atmosphere; this one is not. No
 * decorative layers, no parallax, no editorial headline competing with the
 * fields — just a clear two-column reading order, the reassurance placed beside
 * the action, and the price restated without surprise.
 */
export default async function CommandePage() {
  const user = await getCurrentUser();
  const [saved, storeRows] = await Promise.all([
    user
      ? db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault))
      : Promise.resolve([]),
    db.select().from(stores).where(eq(stores.isActive, true)),
  ]);

  return (
    <div className="min-h-dvh bg-paper">
      <div className="border-b border-stone/70">
        <div className="container-narrow flex items-center justify-between gap-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-2">
            Commande sécurisée — Cléopâtre
          </p>
          <a
            href="tel:+21671450210"
            className="hidden text-[10px] font-bold uppercase tracking-[0.24em] text-muted-2 transition-colors hover:text-ink sm:block"
          >
            Besoin d&apos;aide ? 71 450 210
          </a>
        </div>
      </div>

      <div className="container-narrow py-10 lg:py-14">
        <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.02em] text-ink">
          Finaliser votre commande
        </h1>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
          Paiement à la livraison, virement ou carte en boutique. Vos coordonnées ne sont jamais revendues ni
          utilisées à d&apos;autres fins.
        </p>
        <div className="mt-10">
          <CheckoutFlow user={user} savedAddresses={saved} stores={storeRows} />
        </div>
      </div>
    </div>
  );
}
