import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { ArrowLeftIcon, LeafIcon } from "@/components/icons";
import { Kicker, Rule } from "@/components/kit/surfaces";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { activeBySlug, listActives, productIdsForActive } from "@/lib/actives";
import { getByIds } from "@/lib/catalog";
import { formatDTShort } from "@/lib/money";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const active = activeBySlug(slug);
  if (!active) return { title: "Actif introuvable" };
  return {
    title: `${active.label} — ${active.family}`,
    description: active.note,
    alternates: { canonical: `/actifs/${active.slug}` },
  };
}

/**
 * LA FICHE D'UN ACTIF.
 *
 * One sentence, then the shelf it belongs to. The point of the page is that
 * the glossary and the catalogue cannot drift apart: the bottoms are real
 * products, live, with their real price and their real stock — the same card
 * as anywhere else, so a sold-out is a sold-out here too.
 */
export default async function ActifPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const active = activeBySlug(slug);
  if (!active) notFound();

  const [ids, all, user] = await Promise.all([productIdsForActive(slug), listActives(), getCurrentUser()]);
  const wished = user
    ? (
        await db
          .select({ id: wishlistItems.productId })
          .from(wishlistItems)
          .where(eq(wishlistItems.userId, user.id))
      ).map((r) => r.id)
    : [];
  const list = await getByIds(ids);
  if (!list.length) notFound();

  const isAuthed = !!user;
  const others = all.filter((a) => a.slug !== active.slug).slice(0, 10);
  const cheapest = Math.min(...list.map((p) => p.priceMillimes));

  return (
    <div className="pb-24">
      <section className="relative isolate overflow-hidden border-b border-line/60 bg-mist/50">
        <MotifLayer motif="clarity" mark={[20, 10]} />
        <div className="shell-wide py-16 lg:py-24">
          <Link
            href="/actifs"
            className="kicker-xs inline-flex items-center gap-2 text-faint transition-colors hover:text-iodine-deep"
          >
            <ArrowLeftIcon size={11} strokeWidth={1.6} /> Le glossaire
          </Link>
          <Reveal>
            <p className="kicker mt-8 text-iodine-deep">{active.family}</p>
            <h1 className="mt-5 font-ant uppercase text-[clamp(2rem,5vw,3.6rem)] font-light leading-[1.05] text-carbon">
              {active.label}
            </h1>
          </Reveal>
          <Reveal y={14} delay={0.08}>
            <p className="mt-7 max-w-[52ch] text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.75] text-carbon">
              {active.note}
            </p>
          </Reveal>
          <Reveal y={12} delay={0.12}>
            <dl className="mt-9 grid gap-x-10 gap-y-5 border-t border-line/70 pt-7 sm:grid-cols-3">
              <div>
                <dt className="kicker-xs text-faint">Références au comptoir</dt>
                <dd className="mt-2 font-ant text-[26px] font-light text-carbon">{list.length}</dd>
              </div>
              <div>
                <dt className="kicker-xs text-faint">À partir de</dt>
                <dd className="mt-2 font-ant text-[26px] font-light text-carbon">{formatDTShort(cheapest)}</dd>
              </div>
              <div>
                <dt className="kicker-xs text-faint">Famille</dt>
                <dd className="mt-2 font-ant text-[26px] font-light text-carbon">{active.family}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="shell-wide pt-16">
        <Reveal>
          <div className="flex items-baseline gap-5">
            <p className="kicker whitespace-nowrap">Les produits qui le portent</p>
            <Rule className="flex-1" />
            <p className="kicker-xs shrink-0 text-faint">{list.length}</p>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {list.map((p, i) => (
            <EditorialProductCard
              key={p.id}
              p={p}
              isAuthed={isAuthed}
              wished={wished.includes(p.id)}
              priority={i < 4}
            />
          ))}
        </div>
      </section>

      <section className="shell-wide pt-20">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Kicker>Le reste du glossaire</Kicker>
              <ul className="mt-6 flex flex-wrap gap-2">
                {others.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/actifs/${a.slug}`}
                      className="inline-flex min-h-9 items-center gap-2 border border-line/70 bg-canvas px-3.5 text-[12px] font-semibold tracking-[0.02em] text-carbon transition-colors hover:border-iodine/40 hover:text-iodine-deep"
                    >
                      {a.label}
                      <span className="text-[10px] font-normal text-faint">{a.n}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/actifs"
                    className="inline-flex min-h-9 items-center border border-transparent px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-iodine-deep"
                  >
                    Tout le glossaire →
                  </Link>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <div className="border border-line/70 bg-canvas p-8">
                <div className="flex items-start gap-4">
                  <LeafIcon size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-iodine-deep" />
                  <p className="text-[13.5px] leading-[1.85] text-muted">
                    La liste des actifs est celle des emballages, telle que le laboratoire
                    l&apos;imprime. Un même actif peut y figurer sous trois orthographes — nous les
                    rassemblons pour vous, mais le produit reste la source : vérifiez la composition
                    sur la fiche, et demandez-nous au comptoir si vous avez une allergie connue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
