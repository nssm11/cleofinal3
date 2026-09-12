import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { brands, concerns, duos, productSubstitutes, products, routineSteps, shelves } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminPage, Table } from "@/components/admin/ui";
import { BrandForm, DuoDelete, DuoForm, MerchSlugOptions, RoutineForm, ShelfDelete, ShelfForm, SubstitutesForm } from "@/components/admin/merch";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/**
 * LA MISE EN SCÈNE — one page for everything the officine arranges around the
 * catalogue: seasonal shelves, duos, need→routine strips, substitutions, brand
 * pages. Five panels, one rule: a curation is only published when it is true
 * and complete (the storefront hides anything under its minimum anyway).
 */
export default async function MiseEnScenePage({ searchParams }: { searchParams: Promise<{ shelf?: string; duo?: string; concern?: string; product?: string; brand?: string }> }) {
  const me = await getCurrentUser();
  if (me?.role !== "admin") redirect("/admin");
  const sp = await searchParams;

  const [shelfRows, duoRows, concernRows, stepRows, subRows, brandRows, productRows] = await Promise.all([
    db.select().from(shelves).orderBy(asc(shelves.id)),
    db.select().from(duos).orderBy(asc(duos.id)),
    db.select().from(concerns).orderBy(asc(concerns.name)),
    db.select().from(routineSteps).orderBy(asc(routineSteps.position)),
    db.select().from(productSubstitutes).orderBy(asc(productSubstitutes.position)),
    db.select().from(brands).orderBy(asc(brands.name)),
    db.select({ id: products.id, slug: products.slug, name: products.name, stock: products.stock, brandId: products.brandId }).from(products).orderBy(asc(products.name)),
  ]);
  const nameBy = new Map(productRows.map((p) => [p.id, p]));
  const heroIds = new Map(brandRows.map((b) => [b.id, b.heroProductIds ?? []]));
  const stepById = new Map(stepRows.map((s) => [s.concernId, s]));

  const selShelf = sp.shelf ? shelfRows.find((x) => x.id === Number(sp.shelf)) ?? null : null;
  const selDuo = sp.duo ? duoRows.find((x) => x.id === Number(sp.duo)) ?? null : null;
  const selConcernSlug = sp.concern ?? concernRows[0]?.slug ?? "";
  const selConcern = concernRows.find((c) => c.slug === selConcernSlug) ?? concernRows[0] ?? null;
  const selProductSlug = sp.product ?? "";
  const selBrandSlug = sp.brand ?? "";

  return (
    <AdminPage title="Mise en scène" sub="Vitrines de saison, duos, rituels, substitutions, pages laboratoires — ce que l’officine ajoute au catalogue.">
      <MerchSlugOptions products={productRows.map((p) => ({ slug: p.slug, name: p.name, stock: p.stock }))} />

      <div className="space-y-12">
        {/* 1 · Shelves */}
        <section>
          <h2 className="mb-4 font-display text-[20px] text-admin-text">Vitrines saisonnières</h2>
          {shelfRows.length > 0 && (
            <Table head={["Titre", "Fenêtre", "Références", "État", ""]} minWidth="min-w-[560px]">
              {shelfRows.map((sh) => (
                <tr key={sh.id} className="hover:bg-admin-panel">
                  <td className="px-4 py-3">{sh.title.fr}</td>
                  <td className="px-4 py-3 text-admin-muted">{MONTHS[sh.startMonth - 1]} → {MONTHS[sh.endMonth - 1]}</td>
                  <td className="px-4 py-3 text-admin-muted">{sh.productIds.length}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.14em]">{sh.isActive ? "visible" : "masquée"}</td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/admin/mise-en-scene?shelf=${sh.id}`} className="text-xs underline decoration-dotted hover:text-admin-gold">Modifier</Link>
                    <ShelfDelete id={sh.id} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
          <div className="mt-4">
            <ShelfForm
              initial={
                selShelf
                  ? { id: selShelf.id, title: selShelf.title, subtitle: selShelf.subtitle, startMonth: selShelf.startMonth, endMonth: selShelf.endMonth, isActive: selShelf.isActive, slugs: selShelf.productIds.map((id) => nameBy.get(id)?.slug ?? String(id)) }
                  : null
              }
            />
          </div>
        </section>

        {/* 2 · Duos */}
        <section>
          <h2 className="mb-4 font-display text-[20px] text-admin-text">Duos pharmacien</h2>
          {duoRows.length > 0 && (
            <Table head={["Duo", "Références", "Remise", "État", ""]} minWidth="min-w-[560px]">
              {duoRows.map((d) => (
                <tr key={d.id} className="hover:bg-admin-panel">
                  <td className="px-4 py-3">{d.name.fr}</td>
                  <td className="px-4 py-3 text-xs text-admin-muted">{nameBy.get(d.productIdA)?.name} + {nameBy.get(d.productIdB)?.name}</td>
                  <td className="px-4 py-3 tabular-nums">{d.discountMillimes / 1000} DT</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.14em]">{d.isActive ? "proposé" : "masqué"}</td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link href={`/admin/mise-en-scene?duo=${d.id}`} className="text-xs underline decoration-dotted hover:text-admin-gold">Modifier</Link>
                    <DuoDelete id={d.id} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
          <div className="mt-4">
            <DuoForm
              initial={
                selDuo
                  ? {
                      id: selDuo.id,
                      name: selDuo.name,
                      note: selDuo.note,
                      slugA: nameBy.get(selDuo.productIdA)?.slug ?? "",
                      slugB: nameBy.get(selDuo.productIdB)?.slug ?? "",
                      nameA: nameBy.get(selDuo.productIdA)?.name ?? "",
                      nameB: nameBy.get(selDuo.productIdB)?.name ?? "",
                      discountDT: String(selDuo.discountMillimes / 1000),
                      isActive: selDuo.isActive,
                    }
                  : null
              }
            />
          </div>
        </section>

        {/* 3 · Routines */}
        {concernRows.length > 0 && selConcern && (
          <section>
            <h2 className="mb-4 font-display text-[20px] text-admin-text">Rituels par besoin</h2>
            <p className="mb-4 text-xs text-admin-muted">
              {concernRows.map((c) => (
                <Link key={c.id} href={`/admin/mise-en-scene?concern=${c.slug}`} className={`mr-3 underline decoration-dotted ${c.id === selConcern?.id ? "text-admin-gold" : "text-admin-muted hover:text-admin-text"}`}>
                  {c.name} {stepRows.filter((s) => s.concernId === c.id).length === 3 ? "✓" : ""}
                </Link>
              ))}
            </p>
            <RoutineForm
              concerns={concernRows.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
              selectedId={selConcern.id}
              stepsByConcern={Object.fromEntries(
                concernRows.map((c) => [
                  c.id,
                  stepRows.filter((s) => s.concernId === c.id).map((s) => ({ pos: s.position, slug: nameBy.get(s.productId)?.slug ?? String(s.productId), label: s.label, reason: s.reason })),
                ]),
              )}
            />
          </section>
        )}

        {/* 4 · Substitutions */}
        <section>
          <h2 className="mb-4 font-display text-[20px] text-admin-text">Substitutions en rupture</h2>
          {subRows.length > 0 && (
            <Table head={["Référence absente", "Remplaçant", "Raison", ""]} minWidth="min-w-[560px]">
              {subRows.map((x) => (
                <tr key={x.id} className="hover:bg-admin-panel">
                  <td className="px-4 py-3">
                    <Link href={`/admin/mise-en-scene?product=${nameBy.get(x.productId)?.slug ?? ""}`} className="hover:underline">{nameBy.get(x.productId)?.name ?? `#${x.productId}`}</Link>
                  </td>
                  <td className="px-4 py-3 text-admin-muted">{nameBy.get(x.substituteProductId)?.name ?? `#${x.substituteProductId}`}</td>
                  <td className="px-4 py-3 text-xs italic text-admin-muted">{x.reason?.fr ?? "—"}</td>
                  <td />
                </tr>
              ))}
            </Table>
          )}
          <div className="mt-4">
            <SubstitutesForm
              selectedSlug={selProductSlug}
              current={(productRows.find((p) => p.slug === selProductSlug)
                ? subRows.filter((x) => x.productId === productRows.find((p) => p.slug === selProductSlug)!.id)
                : []
              ).map((x) => ({ slug: nameBy.get(x.substituteProductId)?.slug ?? "", name: nameBy.get(x.substituteProductId)?.name ?? "", reason: x.reason }))}
            />
          </div>
        </section>

        {/* 5 · Brand pages */}
        <section>
          <h2 className="mb-4 font-display text-[20px] text-admin-text">Pages laboratoires</h2>
          <Table head={["Laboratoire", "Histoire", "Réf. héro", ""]} minWidth="min-w-[480px]">
            {brandRows.map((b) => (
              <tr key={b.id} className="hover:bg-admin-panel">
                <td className="px-4 py-3">{b.name}</td>
                <td className="max-w-[36ch] truncate px-4 py-3 text-xs italic text-admin-muted">{b.story ? `${b.story.slice(0, 60)}…` : "à écrire"}</td>
                <td className="px-4 py-3 text-admin-muted">{(heroIds.get(b.id) ?? []).length}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/mise-en-scene?brand=${b.slug}`} className="text-xs underline decoration-dotted hover:text-admin-gold">Écrire</Link>
                </td>
              </tr>
            ))}
          </Table>
          <div className="mt-4">
            <BrandForm
              selectedSlug={selBrandSlug}
              brands={brandRows.map((b) => ({
                slug: b.slug,
                name: b.name,
                story: b.story,
                heroSlugs: (b.heroProductIds ?? []).map((id) => nameBy.get(id)?.slug ?? String(id)),
              }))}
            />
          </div>
        </section>
      </div>
          </AdminPage>
  );
}
