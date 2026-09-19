import type { Metadata } from "next";
import { SectionBrow } from "@/components/orders/order-cards";
import { PersonalShelf } from "@/components/next-features/account-tools";
import { miniProducts } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon étagère" };

export default async function CompteEtagerePage() {
  const products = await miniProducts();
  return (
    <section className="max-w-[64rem]">
      <SectionBrow index="14" eyebrow="Salle de bain" title="Mon étagère personnelle" description="Gardez les produits ouverts chez vous avec une date indicative et des notes privées." />
      <div className="mt-8">
        <PersonalShelf products={products} />
      </div>
    </section>
  );
}
