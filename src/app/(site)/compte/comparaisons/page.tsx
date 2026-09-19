import type { Metadata } from "next";
import { SectionBrow } from "@/components/orders/order-cards";
import { SavedComparisonsPage } from "@/components/next-features/account-tools";
import { miniProducts } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comparaisons sauvegardées" };

export default async function CompteComparaisonsPage() {
  const products = await miniProducts();
  return (
    <section className="max-w-[64rem]">
      <SectionBrow index="11" eyebrow="Comparateur" title="Mes comparaisons sauvegardées" description="Les tableaux produit que vous avez gardés sur ce navigateur." />
      <div className="mt-8">
        <SavedComparisonsPage products={products} />
      </div>
    </section>
  );
}
