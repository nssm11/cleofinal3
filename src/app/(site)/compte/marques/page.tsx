import type { Metadata } from "next";
import { SectionBrow } from "@/components/orders/order-cards";
import { FavoriteBrandsPage } from "@/components/next-features/account-tools";
import { brandFollowRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Marques suivies" };

export default async function CompteMarquesPage() {
  const brands = await brandFollowRows();
  return (
    <section className="max-w-[64rem]">
      <SectionBrow index="12" eyebrow="Marques" title="Mes marques suivies" description="Suivez vos laboratoires favoris et retrouvez leurs nouveautés plus vite." />
      <div className="mt-8">
        <FavoriteBrandsPage brands={brands} />
      </div>
    </section>
  );
}
