import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, wishlistItems, wishlistShares } from "@/db/schema";
import { getByIds } from "@/lib/catalog";
import { ProductGrid } from "@/components/catalog/product-card";
import { Breadcrumbs, EmptyState } from "@/components/ui/primitives";
import { GiftIcon, HeartIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * UNE SÉLECTION PARTAGÉE — la page que reçoit la personne à qui on a envoyé
 * le lien.
 *
 * `noindex, nofollow` : ce n'est pas une page du catalogue, c'est une liste
 * privée dont l'adresse tient lieu de clé. La faire indexer reviendrait à
 * publier ce que l'on a choisi de ne donner qu'à une personne — et la
 * directive est la seule garantie qui tienne, puisqu'une fois le shell streamé
 * le statut HTTP d'un `notFound()` peut légitimement rester 200.
 *
 * Le jeton est la seule condition d'accès. S'il est inconnu, révoqué ou
 * suspendu, la réponse est la même — `notFound()` — pour ne pas révéler par un
 * message différent si un lien a existé un jour.
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const [share] = await db
    .select({ title: wishlistShares.title })
    .from(wishlistShares)
    .where(eq(wishlistShares.token, token))
    .limit(1);
  return {
    title: share ? share.title : "Sélection introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function SharedWishlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const [share] = await db
    .select()
    .from(wishlistShares)
    .where(eq(wishlistShares.token, token))
    .limit(1);
  if (!share || !share.isPublic) notFound();

  const owner = await db.query.users.findFirst({
    where: eq(users.id, share.userId),
    columns: { firstName: true },
  });

  const ids = (
    await db
      .select({ id: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, share.userId))
  ).map((w) => w.id);
  const items = await getByIds(ids);

  return (
    <div className="container-lux py-section-sm">
      <Breadcrumbs items={[{ label: share.title }]} />

      <header className="mt-8 text-center">
        <p className="eyebrow flex items-center justify-center gap-2 text-champagne-2">
          <GiftIcon size={13} /> Sélection partagée
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.06] tracking-[-0.022em] text-ink">
          {share.title}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-muted">
          {owner ? `${owner.firstName} a` : "On vous a"} réuni ces références chez Cléopâtre. Rien
          d&apos;autre n&apos;est visible ici — ni coordonnées, ni commandes.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<HeartIcon size={22} />}
            title="La liste est vide"
            description="Cette sélection ne contient plus aucune référence disponible."
            action={{ href: "/boutique", label: "Découvrir la boutique" }}
          />
        </div>
      ) : (
        <div className="mt-12">
          <ProductGrid items={items} isAuthed={false} priorityCount={2} />
        </div>
      )}

      <section className="mx-auto mt-16 max-w-2xl border-t border-stone pt-8 text-center">
        <p className="text-[13.5px] leading-relaxed text-charcoal">
          Une question sur l&apos;une de ces références&nbsp;? Un pharmacien répond,&nbsp;
          <a href="tel:+21671450210" className="text-ink underline underline-offset-4">
            71 450 210
          </a>
          .
        </p>
        <p className="mt-3 text-[12px] text-muted-2">
          Vous aussi, gardez vos soins de côté :{" "}
          <Link href="/inscription" className="text-ink underline underline-offset-4">
            créez un compte
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
