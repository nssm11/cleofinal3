import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/catalog";
import { parseFilters, type SP } from "@/components/catalog/listing";
import { VisageCinematic } from "@/components/visage/visage-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  return c
    ? {
        title: `Univers ${c.name}`,
        description: c.description ?? undefined,
        alternates: { canonical: `/univers/${c.slug}` },
        openGraph: c.image ? { images: [c.image] } : undefined,
      }
    : {};
}

/**
 * L'UNIVERS — un rayon de la maison, composé comme une visite.
 *
 * One tree serves every universe: the opening frame (its own film, its own
 * words), the ritual finder, the full shelf with the filter console, the
 * editorial interlude, the sub-rayons, the counsel and the other chapters.
 * Every number on the page is counted from the live catalogue, and the query
 * string remains the only state — back, forward, sharing and reloading all
 * tell the truth.
 */
export default async function UniversPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  /* One tree, five rooms: the film-composed composition is fully data-driven
     (cinema, story, facets, rayons, chapters), so every universe — Visage,
     Cheveux, Corps, Solaire, Bébé & Maman, Compléments, Hygiène & Bien-être —
     keeps its own footage, words and counts. */
  return <VisageCinematic slug={slug} sp={sp} />;
}
