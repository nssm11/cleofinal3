import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryMovements, orders, products, reviews, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Glyph } from "@/components/admin/os/icons";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";

const EXPORTS = [
  { kind: "orders", icon: "bag" as const, title: "Commandes", hint: "Numéro, date, statuts, paiement, coordonnées, montants — millime par millime.", table: "orders" },
  { kind: "products", icon: "cube" as const, title: "Produits", hint: "SKU, prix, stock, seuil, statut, mise en avant â le catalogue tel qu’il est.", table: "products" },
  { kind: "customers", icon: "users" as const, title: "Clientes", hint: "Comptes, coordonnées, rôle, points fidélité — jamais de mot de passe, jamais de secret.", table: "users" },
  { kind: "reviews", icon: "star" as const, title: "Avis", hint: "Auteur, note, statut de modération, texte tronqué à 400 caractères.", table: "reviews" },
  { kind: "stock", icon: "layers" as const, title: "Mouvements de stock", hint: "Chaque entrée et sortie du registre, avec le stock résultant.", table: "inventory_movements" },
];

/**
 * EXPORTS & RAPPORTS
 *
 * La maison ne « fabrique » pas de rapport : elle sort ce qu'elle a. Cinq
 * registres, un bouton chacun, un CSV chacun. Le fichier porte la date du
 * jour et le contenu exact du registre — pas une ligne de plus, pas une
 * ligne de moins.
 */
export default async function Echanges() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const [ordersCount, productsCount, usersCount, reviewsCount, movementsCount] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders),
    db.select({ n: sql<number>`count(*)::int` }).from(products),
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    db.select({ n: sql<number>`count(*)::int` }).from(reviews),
    db.select({ n: sql<number>`count(*)::int` }).from(inventoryMovements),
  ]);
  const counts: Record<string, number> = {
    orders: ordersCount[0]?.n ?? 0,
    products: productsCount[0]?.n ?? 0,
    customers: usersCount[0]?.n ?? 0,
    reviews: reviewsCount[0]?.n ?? 0,
    stock: movementsCount[0]?.n ?? 0,
  };

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-os-faint">Analytique · Registres</p>
          <h1 className="mt-1.5 font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.02] tracking-tight text-os-text">Exports &amp; rapports</h1>
          <p className="mt-1 max-w-[64ch] text-[13px] text-os-muted">
            Cinq registres, un CSV chacun. Le fichier sort directement de la base, authentifié et horodaté — ce que vous comptez ici est exactement ce que le fichier contiendra.
          </p>
        </div>
        <Tag tone="gold">CSV · UTF-8 · séparateur virgule</Tag>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {EXPORTS.map((e) => (
          <Sheet key={e.kind} className="flex flex-col justify-between gap-4 transition-colors hover:border-os-line-strong">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center bg-champagne-soft text-os-gold-2 ring-1 ring-champagne-3/40">
                  <Glyph name={e.icon} size={18} />
                </span>
                <span className="os-num text-right">
                  <span className="block font-display text-[1.5rem] leading-none text-os-text">{new Intl.NumberFormat("fr-TN").format(counts[e.kind] ?? 0)}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-os-faint">ligne(s)</span>
                </span>
              </div>
              <h2 className="mt-3 font-display text-[1.15rem] tracking-tight text-os-text">{e.title}</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-os-muted">{e.hint}</p>
            </div>
            <a
              href={`/admin/echanges/export?kind=${e.kind}`}
              className="group inline-flex min-h-10 items-center justify-center gap-2 border border-os-line bg-os-surface px-3.5 text-[11px] font-bold uppercase tracking-[0.13em] text-os-text transition-colors hover:border-os-ink hover:bg-os-ink hover:text-os-onink"
            >
              <Glyph name="download" size={14} className="transition-colors group-hover:text-os-gold" />
              Exporter {e.title.toLowerCase()}
            </a>
          </Sheet>
        ))}

        <Sheet className="flex flex-col justify-between gap-3 border-dashed">
          <div>
            <h2 className="font-display text-[1.15rem] tracking-tight text-os-text">Import</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-os-muted">
              L’entrÃ©e de donnÃ©es n’est pas un fichier dÃ©posÃ© dans une boÃ®te : c’est une opÃ©ration encadrÃ©e, revue ligne par ligne. Elle n’existe pas encore pour les registres ci-dessus â la maison prÃ©fÃ¨re un import qui n’existe pas Ã  un import qui Ã©craserait le registre.
            </p>
          </div>
          <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-os-gold hover:text-os-gold-2">
            Saisir à la main dans le catalogue <Glyph name="arrowRight" size={12} />
          </Link>
        </Sheet>
      </div>

      <Sheet className="mt-3">
        <SectionHead
          eyebrow="Méthode"
          title="Ce que la maison promet"
          sub="Un export est une photo du registre Ã  l’instant du clic : aucune ligne inventÃ©e, aucune colonne dÃ©guisÃ©e. Les montants sont en dinars Ã  trois dÃ©cimales (millimes Ã· 1000) et les dates au format ISO 8601 â lisibles par un tableur, fidÃ¨les au registre."
        />
      </Sheet>
    </div>
  );
}
