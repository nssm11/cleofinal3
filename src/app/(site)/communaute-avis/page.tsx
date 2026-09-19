import type { Metadata } from "next";
import Link from "next/link";
import { FeatureHero, MetricStrip } from "@/components/next-features/public-shell";
import { CommunityVotes } from "@/components/next-features/customer-workflows";
import { Badge } from "@/components/ui/primitives";
import { reviewCommunityRows, verifiedReviewStats } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Avis communauté",
  description: "Avis utiles, badges acheteur vérifié, votes et contenus avant/après modérés.",
};

export default async function CommunauteAvisPage() {
  const [reviews, stats] = await Promise.all([reviewCommunityRows(), verifiedReviewStats()]);
  return (
    <div>
      <FeatureHero
        eyebrow="Communauté"
        title="Avis utiles et contenus modérés"
        description="Un espace public qui montre les avis vérifiés, les votes utiles, les questions prioritaires et les contenus photo en attente de modération."
      />
      <section className="shell-wide space-y-10 py-14 lg:py-20">
        <MetricStrip items={[{ label: "Avis approuvés", value: stats.total }, { label: "Acheteur vérifié", value: stats.verified }, { label: "Listes envie", value: stats.wishes }, { label: "Votes", value: "local" }]} />
        <CommunityVotes />
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.slice(0, 8).map((review) => (
            <article key={review.id} className="border border-line/70 bg-porcelain p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kicker-xs text-faint">{review.authorName} · {review.rating}/5</p>
                  <h2 className="mt-2 font-ant uppercase text-[1.2rem] leading-tight text-carbon">{review.title ?? "Avis produit"}</h2>
                </div>
                {review.isVerified && <Badge tone="success">vérifié</Badge>}
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{review.body}</p>
              <Link href={`/produit/${review.productSlug}`} className="mt-4 inline-flex text-[10px] font-bold uppercase tracking-[0.18em] text-iodine-deep">{review.productName}</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
