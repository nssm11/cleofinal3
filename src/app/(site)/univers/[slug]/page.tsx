import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { facetsFor, getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { parseFilters, type SP } from "@/components/catalog/listing";
import { Listing } from "@/components/catalog/listing";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { Chapter, Status } from "@/components/kit/surfaces";
import { Mask, Stagger, StaggerItem } from "@/components/kit/motion";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { EditorReviews } from "@/components/univers/voices";
import { getCopy } from "@/lib/i18n/server";

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
 * UN RAYON DE LA MAISON — the universe, in one composition for all seven.
 *
 *   LE GÉNÉRIQUE   the universe's own footage, poster type, live figures
 *   LE RÉCIT       what the pharmacists say about this part of the body
 *   LES BESOINS    the needs this universe answers, with real counts
 *   LE RAYON       the whole shelf, filterable, paginated
 *   LES VOIX       what customers said about what is sold here
 *   LES AUTRES     the other universes, as doors
 *
 * Same queries, same query keys, same wishlist and cart roads as before — only
 * the composition is new.
 */
export default async function UniversPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [u, all, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!u || !u.isUniverse) notFound();

  const atm = atmosphereFor(u.slug);
  const index = all.findIndex((x) => x.id === u.id);
  const cinema =
    UNIVERSE_CINEMA[u.slug] ?? {
      video: "hero-main",
      poster: "hero",
      kicker: u.name.toUpperCase(),
      title: atm.promise.split("—")[0].trim(),
    };
  const basePath = `/univers/${u.slug}`;

  const filters = { universeId: u.id, ...parseFilters(sp) };
  const [facets, list] = await Promise.all([facetsFor({ universeId: u.id }), listProducts(filters)]);
  const user = await getCurrentUser();
  void user;
  const labs = facets.brands.slice(0, 6);

  return (
    <main className="overflow-x-clip bg-canvas">
      {/* ══ LE GÉNÉRIQUE ════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[86svh] flex-col justify-end overflow-hidden bg-petrol text-chalk">
        <div className="absolute inset-0">
          <CinematicVideo
            eager
            sources={{ desktop: `/videos/${cinema.video}.mp4`, mobile: `/videos/${cinema.video}-mobile.mp4` }}
            poster={`/videos/posters/${cinema.poster}.jpg`}
            alt={`${u.name} — ${cinema.title}`}
          />
        </div>
        <div aria-hidden className="absolute inset-0 bg-petrol/58" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] bg-petrol/82" />
        <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative shell-wide pb-10 pt-32 lg:pb-14">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span aria-hidden className="marker bg-iodine" />
            <span className="kicker text-chalk-muted">{cinema.kicker}</span>
            <span className="kicker text-chalk-faint">
              Rayon {String(index + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <Mask delay={0.05}>
                <h1 className="max-w-[20ch] font-ant text-[clamp(2.8rem,8vw,7rem)] uppercase leading-[0.86] text-chalk">
                  {u.name}
                </h1>
              </Mask>
              <p className="mt-5 max-w-[52ch] text-lead text-chalk-muted">
                {u.description ?? atm.promise}
              </p>
            </div>

            <div className="lg:col-span-5 lg:ps-8">
              <dl className="grid grid-cols-3 gap-px border border-night-line bg-night-line">
                {[
                  { v: list.total, l: "Références" },
                  { v: labs.length, l: "Laboratoires" },
                  { v: u.children.length, l: "Sous-rayons" },
                ].map((s) => (
                  <div key={s.l} className="bg-petrol/80 p-4">
                    <dd className="data text-[1.5rem] text-chalk">{String(s.v).padStart(2, "0")}</dd>
                    <dt className="kicker-xs mt-2 text-chalk-faint">{s.l}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#rayon" className="btn-night-solid">
                  Voir le rayon
                </a>
                <Link href="/diagnostic" className="btn-night">
                  Diagnostic peau
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ LE RÉCIT ════════════════════════════════════════════════════ */}
      <section className="shell-wide py-block lg:py-block-lg">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Chapter index="01" label="Le récit" title="Ce que nous en disons" />
          </div>
          <div className="lg:col-span-8 lg:border-s lg:border-line lg:ps-8">
            <p className="max-w-[62ch] text-lead text-carbon">{u.story ?? atm.promise}</p>
            {labs.length > 0 && (
              <>
                <p className="kicker-xs mt-10">Les laboratoires de ce rayon</p>
                <Stagger className="mt-4 flex flex-wrap gap-2">
                  {labs.map((b) => (
                    <StaggerItem key={b.slug}>
                      <Link href={`/marque/${b.slug}`} className="chip">
                        {b.name}
                        <span className="data text-[0.625rem] text-iodine">{String(b.n).padStart(2, "0")}</span>
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              </>
            )}

            {facets.tolerances.length > 0 && (
              <>
                <p className="kicker-xs mt-10">Tolérances vérifiées en rayon</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {facets.tolerances.map((t) => (
                    <li key={t.key}>
                      <Status tone="ok">
                        {copy.merch.tol[t.key as keyof typeof copy.merch.tol] ?? t.key}
                        <span className="data">· {t.n}</span>
                      </Status>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══ LES BESOINS ═════════════════════════════════════════════════ */}
      {facets.concerns.length > 0 && (
        <section className="border-y border-line bg-mist">
          <div className="shell-wide py-block">
            <Chapter
              index="02"
              label="Les besoins"
              title="À quoi répond ce rayon"
              align="between"
              action={{ href: "/diagnostic", label: "Diagnostic peau" }}
              className="mb-8"
            />
            <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {facets.concerns.map((c, i) => (
                <li key={c.slug} className="bg-mist">
                  <Link href={`/besoin/${c.slug}`} className="group flex items-center justify-between gap-4 p-5">
                    <span className="flex items-baseline gap-3">
                      <span className="data text-[0.625rem] text-iodine">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-ant text-[1.15rem] uppercase leading-none text-carbon transition-colors group-hover:text-iodine">
                        {c.name}
                      </span>
                    </span>
                    <span className="data text-[0.6875rem] text-faint">{c.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ══ SOUS-RAYONS ═════════════════════════════════════════════════ */}
      {u.children.length > 0 && (
        <section className="shell-wide py-band">
          <p className="kicker-xs mb-5">Dans ce rayon</p>
          <ul className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {u.children.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={`/categorie/${c.slug}`} className="chip">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ══ LE RAYON ════════════════════════════════════════════════════ */}
      <section id="rayon" className="shell-wide pb-block lg:pb-block-lg">
        <Chapter index="03" label="Le rayon" title={`Tout ${u.name}`} className="mb-8" />
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
          <Listing base={{ universeId: u.id }} sp={sp} basePath={basePath} hideBrands={false} />
        </Suspense>
      </section>

      {/* ══ LES VOIX ════════════════════════════════════════════════════ */}
      <EditorReviews universeId={u.id} name={u.name} />

      {/* ══ LES AUTRES RAYONS ═══════════════════════════════════════════ */}
      <section className="border-t border-line">
        <div className="shell-wide py-block lg:py-block-lg">
          <Chapter
            index="05"
            label="Continuer"
            title="Les autres rayons"
            action={{ href: "/boutique", label: "Toute la boutique" }}
            align="between"
            className="mb-8"
          />
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {all
              .filter((x) => x.id !== u.id)
              .map((x) => (
                <li key={x.id} className="bg-canvas">
                  <Link href={`/univers/${x.slug}`} className="group block">
                    <span className="plate relative block aspect-[16/10] bg-canvas-2">
                      {x.image && (
                        <Image
                          src={x.image}
                          alt=""
                          fill
                          sizes="(max-width:640px) 100vw, 33vw"
                          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.03]"
                        />
                      )}
                    </span>
                    <span className="mt-4 flex items-baseline justify-between gap-4">
                      <span className="font-ant text-[1.35rem] uppercase leading-none text-carbon transition-colors group-hover:text-iodine">
                        {x.name}
                      </span>
                      <span aria-hidden className="h-px w-6 bg-line-strong transition-all group-hover:w-10 group-hover:bg-iodine" />
                    </span>
                    {x.description && (
                      <span className="mt-2 block max-w-[38ch] text-[0.8125rem] text-muted">{x.description}</span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
