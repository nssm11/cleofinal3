import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, type ListFilters, type ProductCard } from "@/lib/catalog";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Best sellers, nouveautés, petits budgets, essentiels saisonniers et sélections conseil de la boutique Cléopâtre.",
  alternates: { canonical: "/collections" },
};

export const dynamic = "force-dynamic";

type Shelf = {
  id: string;
  title: string;
  deck: string;
  href: string;
  filters: ListFilters;
};

const shelves: Shelf[] = [
  {
    id: "best-sellers",
    title: "Best sellers de la semaine",
    deck: "Les références les plus choisies, triées par ventes réelles du catalogue.",
    href: "/boutique?sort=bestsellers",
    filters: { sort: "bestsellers", perPage: 8, inStock: true },
  },
  {
    id: "new",
    title: "Nouveautés",
    deck: "Ce qui vient d'arriver au comptoir et mérite une première place dans la routine.",
    href: "/boutique?sort=newest",
    filters: { sort: "newest", perPage: 8, inStock: true },
  },
  {
    id: "pharmacist",
    title: "Choix pharmacien",
    deck: "La sélection la plus sûre pour commencer : tolérance, utilité, disponibilité.",
    href: "/boutique?sort=featured",
    filters: { sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "budget",
    title: "Petits budgets",
    deck: "Trois seuils utiles — moins de 30, 50 et 100 DT — sans sacrifier la qualité.",
    href: "/boutique?max=50000",
    filters: { sort: "price_asc", maxPrice: 50_000, perPage: 8, inStock: true },
  },
  {
    id: "french-pharmacy",
    title: "Favoris pharmacie française",
    deck: "Les laboratoires dermo-cosmétiques historiques et les formules repères.",
    href: "/marques",
    filters: { sort: "rating", perPage: 8, inStock: true },
  },
  {
    id: "summer",
    title: "Essentiels été",
    deck: "SPF, après-soleil, textures légères et gestes qui gardent la barrière confortable.",
    href: "/besoin/protection-solaire",
    filters: { concernSlugs: ["protection-solaire", "hydratation"], sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "barrier",
    title: "Réparation barrière",
    deck: "Baumes, crèmes riches et nettoyants doux pour une peau qui tire ou réagit.",
    href: "/besoin/peau-sensible",
    filters: { concernSlugs: ["peau-sensible", "peau-seche"], sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "pregnancy",
    title: "Routine grossesse compatible",
    deck: "Des fiches dont la tolérance grossesse est renseignée, jamais supposée.",
    href: "/boutique?tolerance=grossesse",
    filters: { tolerances: ["grossesse"], sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "teen-acne",
    title: "Starter kit imperfections ado",
    deck: "Nettoyer, traiter, hydrater, protéger : quatre gestes lisibles, pas dix actifs empilés.",
    href: "/besoin/imperfections",
    filters: { concernSlugs: ["imperfections", "acne"], sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "men",
    title: "Grooming homme",
    deck: "Nettoyants, hydratants, déodorants et SPF simples à reprendre chaque matin.",
    href: "/recherche?q=d%C3%A9odorant",
    filters: { q: "Déodorant", sort: "featured", perPage: 8, inStock: true },
  },
  {
    id: "travel",
    title: "Format voyage et trousse courte",
    deck: "Une trousse efficace : nettoyer, hydrater, protéger, réparer, sans surcharge.",
    href: "/boutique?max=100000",
    filters: { sort: "price_asc", maxPrice: 100_000, perPage: 8, inStock: true },
  },
  {
    id: "back",
    title: "De retour en stock",
    deck: "Les références disponibles à nouveau, à surveiller aussi depuis les favoris.",
    href: "/boutique?stock=1",
    filters: { sort: "newest", perPage: 8, inStock: true },
  },
];

async function loadShelf(shelf: Shelf): Promise<Shelf & { products: ProductCard[] }> {
  const { items } = await listProducts(shelf.filters);
  return { ...shelf, products: items };
}

function ProductRail({ shelf, index }: { shelf: Shelf & { products: ProductCard[] }; index: number }) {
  return (
    <section id={shelf.id} className="border-t border-line py-12 lg:py-16">
      <Chapter
        index={String(index + 1).padStart(2, "0")}
        label="Collection"
        title={shelf.title}
        lede={shelf.deck}
        action={{ href: shelf.href, label: "Voir toute la sélection" }}
      />
      {shelf.products.length ? (
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {shelf.products.map((product, i) => (
            <EditorialProductCard key={`${shelf.id}-${product.id}`} p={product} priority={index === 0 && i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-line bg-porcelain p-6 text-[14px] text-muted">
          Cette collection n&apos;a pas encore assez de références. Elle reste disponible pour la mise en scène et renvoie vers la boutique complète.
        </div>
      )}
    </section>
  );
}

export default async function CollectionsPage() {
  const loaded = await Promise.all(shelves.map(loadShelf));

  return (
    <div>
      <PageIntro
        kicker="Collections"
        index="12"
        rail="Discovery"
        title={
          <>
            Des portes courtes
            <br />
            vers le bon rayon.
          </>
        }
        intro="Les collections transforment la boutique en parcours : best sellers, nouveautés, budget, grossesse, ado, été, barrière cutanée, retours en stock. Chaque rail lit le catalogue réel."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Collections" }]}
        right={
          <>
            <Link href="/diagnostic" className="btn-solid">
              Lancer le diagnostic
            </Link>
            <Link href="/routine-builder" className="btn-ghost">
              Composer une routine
            </Link>
          </>
        }
      >
        <nav aria-label="Collections" className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {loaded.map((shelf, i) => (
            <Link key={shelf.id} href={`#${shelf.id}`} className="group bg-canvas p-5 transition-colors hover:bg-iodine/5">
              <span className="kicker-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-4 block font-ant text-[1.45rem] uppercase leading-none text-carbon group-hover:text-iodine-deep">
                {shelf.title}
              </span>
            </Link>
          ))}
        </nav>
      </PageIntro>

      <div className="shell-wide pb-block-lg">
        {loaded.map((shelf, index) => (
          <ProductRail key={shelf.id} shelf={shelf} index={index} />
        ))}
      </div>
    </div>
  );
}
