import type { Metadata } from "next";
import Link from "next/link";
import { FeatureHero, MetricStrip } from "@/components/next-features/public-shell";
import { Badge } from "@/components/ui/primitives";
import { nearExpiryRows } from "@/lib/next-feature-queries";
import { formatDTShort } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Courtes dates",
  description: "Produits proches de leur date avec statut lot, remise courte date et comptoir.",
};

function days(value: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export default async function CourtesDatesPage() {
  const rows = await nearExpiryRows();
  const urgent = rows.filter((row) => {
    const d = days(row.expiresAt);
    return d !== null && d < 45;
  }).length;
  return (
    <div>
      <FeatureHero
        eyebrow="Anti-gaspillage"
        title="Le rayon courtes dates"
        description="Les lots proches de leur date sont rendus visibles avec leur comptoir, leur quantité et leur remise de lot."
      />
      <section className="shell-wide space-y-8 py-14 lg:py-20">
        <MetricStrip items={[{ label: "Lots affichés", value: rows.length }, { label: "Sous 45 jours", value: urgent }, { label: "Avec remise", value: rows.filter((row) => row.clearancePercent > 0).length }, { label: "Traçabilité", value: "lot" }]} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const d = days(row.expiresAt);
            const discount = row.clearancePercent || (d !== null && d < 45 ? 25 : d !== null && d < 90 ? 15 : 10);
            return (
              <article key={row.id} className="border border-line/70 bg-porcelain p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{row.brandName}</p>
                    <Link href={`/produit/${row.productSlug}`} className="mt-1 block font-ant uppercase text-[1.25rem] leading-tight text-carbon hover:text-iodine-deep">{row.productName}</Link>
                  </div>
                  <Badge tone="warning">-{discount}%</Badge>
                </div>
                <p className="mt-4 text-[13px] text-muted">Lot {row.lot} · {row.storeName} · {row.quantity} unités</p>
                <p className="mt-2 text-[13px] text-muted">DLC : {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("fr-FR") : "non datée"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="ink">{formatDTShort(row.priceMillimes)}</Badge>
                  <Badge tone={d !== null && d < 45 ? "error" : "accent"}>{d === null ? "à dater" : `${d} jours`}</Badge>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
