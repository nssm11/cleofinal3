import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";
import { getLocale } from "@/lib/i18n/server";
import { localeCategory } from "@/lib/i18n/content";
import { getCopy } from "@/lib/i18n/server";

export type NavChild = { id: number; slug: string; name: string };
export type NavUniverse = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  story: string | null;
  children: NavChild[];
};

export type MegaColumn = { heading: string; items: { slug: string; name: string; href: string }[] };
export type MegaGroup = {
  id: string;
  label: string;
  href: string;
  description: string;
  image: string | null;
  story: string | null;
  columns: MegaColumn[];
  callout?: { href: string; label: string };
};

/**
 * The navigation model of the house.
 *
 * One panel per universe — the seven rayons of the pharmacy — each composed
 * from live catalogue data: its real categories, the concerns it answers and
 * the laboratories that lead it. Nothing is hard-coded, so the navigation can
 * never drift away from what is actually in stock.
 */
export const getNavigationData = cache(async () => {
  const [loc, copy] = await Promise.all([getLocale(), getCopy()]);
  const np = copy.header.navPanel;
  const rawUniverses = await db.query.categories.findMany({
    where: eq(categories.isUniverse, true),
    orderBy: asc(categories.sortOrder),
    with: { children: { orderBy: asc(categories.sortOrder) } },
  });
  const universes =
    loc === "fr"
      ? rawUniverses
      : rawUniverses.map((u) => ({ ...localeCategory(u, loc), children: u.children.map((c) => localeCategory(c, loc)) }));

  const featuredBrands = await db
    .select({ slug: brands.slug, name: brands.name })
    .from(brands)
    .where(eq(brands.isFeatured, true))
    .orderBy(asc(brands.name))
    .limit(6);

  /** Editorial pairing: each universe gets the two or three needs it speaks to. */
  const concernsByUniverse: Record<string, { name: string; href: string }[]> = {
    visage: [
      { name: "Peau sensible", href: "/besoin/peau-sensible" },
      { name: "Hydratation", href: "/besoin/hydratation" },
      { name: "Anti-âge", href: "/besoin/anti-age" },
      { name: "Imperfections", href: "/besoin/imperfections" },
    ],
    corps: [
      { name: "Sécheresse", href: "/besoin/secheresse" },
      { name: "Fermeté", href: "/besoin/fermete" },
      { name: "Peau atopique", href: "/besoin/peau-atopique" },
    ],
    cheveux: [
      { name: "Chute de cheveux", href: "/besoin/chute-de-cheveux" },
      { name: "Pellicules", href: "/besoin/pellicules" },
      { name: "Cuir chevelu sensible", href: "/besoin/cuir-chevelu-sensible" },
    ],
    solaire: [
      { name: "Protection solaire", href: "/besoin/protection-solaire" },
      { name: "Taches", href: "/besoin/taches" },
    ],
    "bebe-maman": [{ name: "Grossesse", href: "/besoin/grossesse" }],
    complements: [
      { name: "Immunité & vitalité", href: "/besoin/immunite" },
      { name: "Sommeil & stress", href: "/besoin/sommeil" },
      { name: "Digestion", href: "/besoin/digestion" },
    ],
    hygiene: [
      { name: "Hygiène intime", href: "/besoin/hygiene-intime" },
      { name: "Bucco-dentaire", href: "/besoin/bucco-dentaire" },
    ],
  };

  const bySlug: Record<string, NavUniverse> = {};
  for (const u of universes) {
    bySlug[u.slug] = {
      id: u.id,
      slug: u.slug,
      name: u.name,
      description: u.description,
      image: u.image,
      story: u.story,
      children: u.children.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    };
  }

  const groups: MegaGroup[] = universes.map((u) => {
    const columns: MegaColumn[] = [
      {
        heading: np.categories,
        items: u.children.map((c) => ({ slug: c.slug, name: c.name, href: `/categorie/${c.slug}` })),
      },
    ];
    const concerns = concernsByUniverse[u.slug];
    if (concerns?.length) columns.push({ heading: np.needs, items: concerns.map((c) => ({ ...c, slug: c.href })) });
    columns.push({
      heading: np.labs,
      items: [
        ...featuredBrands.slice(0, 3).map((b) => ({ slug: b.slug, name: b.name, href: `/marque/${b.slug}` })),
        { slug: "toutes-les-marques", name: "Toutes les marques", href: "/marques" },
      ],
    });

    return {
      id: u.slug,
      label: u.name,
      href: `/univers/${u.slug}`,
      description: u.description ?? "",
      image: u.image,
      story: u.story,
      columns,
      callout: { href: `/univers/${u.slug}`, label: np.enter.replace("{name}", u.name) },
    };
  });

  return { universes: Object.values(bySlug), groups };
});
