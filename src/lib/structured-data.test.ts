import assert from "node:assert/strict";
import { test } from "node:test";
import { breadcrumbLd, itemListLd } from "./structured-data";

test("a breadcrumb keeps its order and links only what has a link", () => {
  const ld = breadcrumbLd([{ name: "Accueil", href: "/" }, { name: "La boutique", href: "/boutique" }, { name: "Sérums" }], "https://cleopatre.tn");
  assert.deepEqual(ld.itemListElement.map((i) => i.position), [1, 2, 3]);
  assert.ok(String(ld.itemListElement[0]!.item).endsWith("/"));
  assert.equal("item" in ld.itemListElement[2], false);
});

test("a list declares only the references it actually shows", () => {
  const ld = itemListLd({
    name: "Sérums",
    path: "/categorie/serums",
    total: 81,
    page: 1,
    site: "https://cleopatre.tn",
    items: [
      { name: "Hyalu B5 Sérum", url: "/produit/la-roche-posay-hyalu-b5-serum", image: "/images/x.jpg", priceMillimes: 129_000, inStock: true },
      { name: "Minéral 89", url: "/produit/vichy-mineral-89", priceMillimes: 89_900, inStock: false },
    ],
  });
  assert.equal(ld.numberOfItems, 81);
  assert.equal(ld.itemListElement.length, 2);
  assert.equal(ld.itemListElement[0]!.position, 1);
  assert.equal(ld.itemListElement[0]!.item.offers?.price, "129.000");
  assert.equal(ld.itemListElement[0]!.item.offers?.priceCurrency, "TND");
  assert.equal(ld.itemListElement[1]!.item.offers?.availability, "https://schema.org/OutOfStock");
  assert.equal("image" in ld.itemListElement[1]!.item, false);
});

test("page two numbers its positions after page one", () => {
  const ld = itemListLd({ name: "Sérums", path: "/categorie/serums", total: 60, page: 2, items: [{ name: "A", url: "/a" }, { name: "B", url: "/b" }] });
  assert.deepEqual(ld.itemListElement.map((i) => i.position), [3, 4]);
});
