import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { PickupScheduler } from "@/components/next-features/customer-workflows";
import { selectStores } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rendez-vous retrait",
  description: "Planifiez un créneau de retrait comptoir.",
};

export default async function RendezVousRetraitPage() {
  const stores = await selectStores();
  return (
    <div>
      <FeatureHero
        eyebrow="Pickup"
        title="Planifier son retrait"
        description="Choisissez un comptoir, une date et un créneau. Le ticket de retrait prépare le passage au comptoir."
      />
      <section className="shell-wide py-14 lg:py-20">
        <PickupScheduler stores={stores} />
      </section>
    </div>
  );
}
