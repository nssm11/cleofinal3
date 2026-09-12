import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategoryBySlug, getUniverses } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { Listing, type SP } from "@/components/catalog/listing";
import { Breadcrumbs, ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { ArrowRightIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  return c
    ? {
        title: c.name,
        description: c.description ?? undefined,
        alternates: { canonical: `/categorie/${c.slug}` },
        openGraph: { images: c.image ? [c.image] : [] },
      }
    : {};
}

/**
 * A SHELF INSIDE A ROOM.
 *
 * Deliberately quieter than a universe opening: the visitor is already inside
 * the house, so the chapter does not need to be announced twice. What it keeps
 * is orientation — the siblings, the parent room, the advisor.
 */
export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [c, unis, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!c || c.isUniverse) notFound();
  const t = copy.categorie;

  const siblings = unis.find((x) => x.slug === c.parent?.slug)?.children ?? [];
  const atmo = atmosphereFor(c.parent?.slug ?? "");

  return (
    <div>
      <section className="relative overflow-hidden bg-paper pb-8 pt-24 lg:pb-10 lg:pt-28">
        <MotifLayer motif={atmo.motif} light={atmo.light} />

        <div className="relative container-wide">
          <Breadcrumbs
            items={[...(c.parent ? [{ href: `/univers/${c.parent.slug}`, label: c.parent.name }] : []), { label: c.name }]}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-7" y={12} amount={0.1}>
              <p className="eyebrow mb-5">{c.parent?.name ?? copy.univers.selection}</p>
              <h1 className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.96] tracking-[-0.025em] text-ink">
                {c.name}
              </h1>
              {c.description && (
                <p className="mt-5 max-w-[36rem] text-[15px] leading-[1.8] text-muted">{c.description}</p>
              )}
            </Reveal>

            {siblings.length > 0 && (
              <Reveal className="lg:col-span-5 lg:pt-4" y={12} delay={0.1}>
                <p className="eyebrow mb-5 text-muted-2">{fmt(t.alsoIn, { name: c.parent?.name ?? "" })}</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {siblings.map((s) =>
                    s.slug === c.slug ? (
                      <li key={s.id}>
                        <span
                          aria-current="page"
                          className="inline-flex items-baseline gap-2 font-display text-[17px] text-champagne-2"
                        >
                          <span aria-hidden className="h-px w-5 bg-champagne-2" />
                          {s.name}
                        </span>
                      </li>
                    ) : (
                      <li key={s.id}>
                        <Link
                          href={`/categorie/${s.slug}`}
                          className="link-underline font-display text-[17px] text-charcoal transition-colors hover:text-ink"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <div className="container-wide pb-10 lg:pb-14">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ categoryId: c.id }} sp={sp} basePath={`/categorie/${c.slug}`} hideConcerns />
        </Suspense>
      </div>

      <section className="relative border-t border-stone/70 bg-cream/60">
        <div className="container-wide flex flex-wrap items-center justify-between gap-5 py-7">
          {c.parent && (
            <Link href={`/univers/${c.parent.slug}`} className="btn-ghost">
              <ArrowRightIcon size={13} className="rotate-180 rtl-mirror" /> {fmt(t.backTo, { name: c.parent.name })}
            </Link>
          )}
          <p className="text-[13px] text-muted">
            {t.doubt}{" "}
            <Link href="/diagnostic" className="link-underline text-ink">
              {t.doubtCta}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
