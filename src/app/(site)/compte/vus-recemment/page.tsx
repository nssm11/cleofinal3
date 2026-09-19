import type { Metadata } from "next";
import { SectionBrow } from "@/components/orders/order-cards";
import { RecentlyViewedAccount } from "@/components/next-features/account-tools";
import { miniProducts } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vus récemment" };

export default async function CompteVusRecemmentPage() {
  const products = await miniProducts();
  return (
    <section className="max-w-[64rem]">
      <SectionBrow index="13" eyebrow="Historique" title="Produits vus récemment" description="Une mémoire locale des fiches que vous avez consultées." />
      <div className="mt-8">
        <RecentlyViewedAccount products={products} />
      </div>
    </section>
  );
}
