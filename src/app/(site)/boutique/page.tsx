import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Listing, type SP } from "@/components/catalog/listing";
import { getUniverses } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Toute la sélection Cléopâtre — dermo-cosmétique, solaire, cheveux, bébé, compléments.",
  alternates: { canonical: "/boutique" },
};

export const dynamic = "force-dynamic";

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<SP> }) {
  const [sp, universes] = await Promise.all([searchParams, getUniverses()]);

  return (
    <div>
      {/* Intro — Swiss */}
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="border-x border-line px-8 py-12 lg:px-12 lg:py-16">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Boutique — 00</p>
                <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.9] tracking-[-0.04em]">
                  TOUTE LA
                  <br />
                  SÉLECTION.
                </h1>
              </div>
              <p className="max-w-[36ch] font-sans text-[14px] leading-[1.6] text-text-secondary">
                Dermo-cosmétique, solaire, cheveux, bébé & maman, compléments, hygiène — chaque référence retenue par nos pharmaciens pour son authenticité et son utilité.
              </p>
            </div>

            <div className="mt-12 grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-4">
              {universes.map((u, i) => (
                <Link key={u.id} href={`/univers/${u.slug}`} className="group bg-bg p-6 hover:bg-bg-2 transition-colors">
                  <span className="font-mono text-[10px] text-text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-6 block font-sans text-[18px] font-semibold tracking-[-0.01em] group-hover:underline underline-offset-4">{u.name}</span>
                  {u.description && <span className="mt-2 block font-sans text-[13px] leading-[1.5] text-text-secondary line-clamp-2">{u.description}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell-wide py-12">
        <div className="border-x border-line px-8 py-8 lg:px-12">
          <Suspense fallback={<div className="h-64 bg-bg-2 animate-pulse" />}>
            <Listing base={{}} sp={sp} basePath="/boutique" />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
