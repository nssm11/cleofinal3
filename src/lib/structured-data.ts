/**
 * Le module reste pur : l'origine du site est passée par l'appelant, jamais
 * lue depuis l'environnement — c'est ce qui permet de tester ce que la page
 * affirme sans monter une base de données.
 */
export type SiteOrigin = string;

/**
 * Données structurées — dites exactement ce que la page montre.
 *
 * Une liste de résultats ne doit pas se déclarer « 81 produits » quand la page
 * en montre 24 : l'indexation enrichie est une affirmation, et une affirmation
 * fausse se paie en confiance. On déclare donc la page, son rang, et les
 * références réellement présentes dessus.
 */

export type Crumb = { name: string; href?: string };
export type ListItem = { name: string; url: string; image?: string | null; priceMillimes?: number; inStock?: boolean };

export function breadcrumbLd(crumbs: Crumb[], site: SiteOrigin = "") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${site}${c.href}` } : {}),
    })),
  };
}

export function itemListLd(args: { name: string; path: string; total: number; page: number; items: ListItem[]; site?: SiteOrigin }) {
  const site = args.site ?? "";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: args.name,
    url: `${site}${args.path}`,
    numberOfItems: args.total,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    ...(args.page > 1 ? { "@id": `${site}${args.path}?page=${args.page}` } : {}),
    itemListElement: args.items.map((it, i) => ({
      "@type": "ListItem",
      position: (args.page - 1) * args.items.length + i + 1,
      item: {
        "@type": "Product",
        name: it.name,
        url: `${site}${it.url}`,
        ...(it.image ? { image: `${site}${it.image}` } : {}),
        ...(it.priceMillimes != null
          ? {
              offers: {
                "@type": "Offer",
                price: (it.priceMillimes / 1000).toFixed(3),
                priceCurrency: "TND",
                availability: it.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                seller: { "@type": "Pharmacy", name: "Cléopâtre" },
              },
            }
          : {}),
      },
    })),
  };
}
