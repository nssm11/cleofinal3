import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCompareRows } from "@/lib/catalog";
import { getCopy } from "@/lib/i18n/server";
import { formatDT } from "@/lib/money";
import { unitPrice } from "@/lib/units";
import { EmptyState } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { CloseIcon, CompareIcon, ArrowRightIcon } from "@/components/icons";
import { CompareAddButton } from "@/components/catalog/compare-add";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le comparateur",
  description: "Deux ou trois références côte à côte : l’usage, la texture, le prix au format, et pour qui.",
  robots: { index: false, follow: false },
};

/**
 * LE COMPARATEUR (P01) — “optional simple compare”, and deliberately spare:
 * usage, texture, who it’s for, format, price, price per real format. Nothing
 * the officine has not typed. The page reads ids from the query, so it is
 * shareable by nature; fewer than two live products and it politely empties.
 */
export default async function ComparerPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const [sp, copy] = await Promise.all([searchParams, getCopy()]);
  const mm = copy.merch;
  const ids = [...new Set((sp.p ?? "").split(",").map((x) => Number.parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 3);
  const rows = await getCompareRows(ids);

  const without = (id: number) => `/comparer?p=${rows.filter((r) => r.product.id !== id).map((r) => r.product.id).join(",")}`;

  return (
    <div>
      <section className="relative overflow-hidden bg-porcelain pb-14 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="clarity" light={[20, 10]} />
        <div className="relative container-wide">
          <p className="eyebrow mb-6 flex items-center gap-3">
            <CompareIcon size={15} className="text-cinabre-2" /> Le comptoir, deux ou trois fois
          </p>
          <Reveal y={12} amount={0.1}>
            <h1 className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[0.98] tracking-[-0.028em] text-ink">{mm.compareTitle}</h1>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-[1.9] text-graphite">{mm.compareDesc}</p>
          </Reveal>
        </div>
      </section>

      {rows.length < 2 ? (
        <div className="container-wide pb-24">
          <EmptyState
            icon={<CompareIcon size={22} />}
            title={mm.compareEmptyTitle}
            description={mm.compareEmptyText}
            action={{ href: "/boutique", label: copy.common.viewAll }}
          />
        </div>
      ) : (
        <section className="container-wide pb-24">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">{mm.compareTitle}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-36 border-b border-rule/70 pb-4 align-bottom">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-ash">—</span>
                  </th>
                  {rows.map(({ product, brandName }) => (
                    <th key={product.id} scope="col" className="border-b border-rule/70 p-0 pb-4 align-bottom font-normal">
                      <div className="relative flex justify-end">
                        <Link
                          href={without(product.id)}
                          className="flex h-8 w-8 items-center justify-center text-ash transition-colors hover:text-error"
                          aria-label={`${mm.compareRemove} — ${product.name}`}
                        >
                          <CloseIcon size={12} />
                        </Link>
                      </div>
                      <Link href={`/produit/${product.slug}`} className="group block">
                        <span className="relative mb-3 block aspect-[4/5] w-full overflow-hidden bg-bone-2">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 40vw, 240px"
                              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                            />
                          )}
                        </span>
                        {product.isCounterPick && (
                          <span className="mb-1 flex items-center gap-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-cinabre-2">
                            <span aria-hidden className="h-px w-3 bg-cinabre-3" />
                            {mm.counterPick}
                          </span>
                        )}
                        {brandName && <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-ash">{brandName}</span>}
                        <span className="mt-1 block font-display text-[17px] leading-snug text-ink transition-colors group-hover:text-cinabre-2">{product.name}</span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                {(
                  [
                    [mm.cu.usage, (r: (typeof rows)[number]) => r.product.shortDescription],
                    [mm.cu.texture, (r: (typeof rows)[number]) => r.product.texture],
                    [mm.cu.who, (r: (typeof rows)[number]) => r.product.forWhom],
                    [mm.cu.format, (r: (typeof rows)[number]) => r.product.volume],
                  ] as const
                ).map(([label, get]) => (
                  <tr key={label}>
                    <th scope="row" className="border-b border-rule/60 py-4 pr-4 align-top">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash">{label}</span>
                    </th>
                    {rows.map((row) => (
                      <td key={row.product.id} className="border-b border-rule/60 px-4 py-4 text-[13.5px] leading-relaxed text-slate">
                        {get(row) || <span className="text-ash">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="border-b border-rule/60 py-4 pr-4 align-top">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash">{mm.cu.price}</span>
                  </th>
                  {rows.map(({ product }) => (
                    <td key={product.id} className="border-b border-rule/60 px-4 py-4">
                      <span className="font-display text-[19px] tabular-nums text-ink">{formatDT(product.priceMillimes)}</span>
                      {product.volume && <span className="block text-[11px] text-ash">{product.volume}</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-4 pr-4 align-top">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash">{mm.cu.per}</span>
                  </th>
                  {rows.map(({ product }) => {
                    const u = unitPrice(product.priceMillimes, product.volume, {
                      forceSmall: /s[ée]rum/i.test(product.name),
                    });
                    return (
                      <td key={product.id} className="px-4 py-4 text-[13px] tabular-nums text-slate">
                        {u ? u.text : <span className="text-ash">—</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-6" />
                  {rows.map(({ product, brandName }) => (
                    <td key={product.id} className="px-4 py-6 align-top">
                      <div className="flex flex-col items-start gap-3">
                        <CompareAddButton
                          line={{
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            brandName: brandName ?? null,
                            image: product.image,
                            priceMillimes: product.priceMillimes,
                            stock: product.stock,
                            volume: product.volume,
                          }}
                        />
                        <Link href={`/produit/${product.slug}`} className="btn-ghost text-[11px]">
                          Voir la fiche <ArrowRightIcon size={12} className="rtl-mirror" />
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
