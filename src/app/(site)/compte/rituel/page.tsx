import { and, asc, desc, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brands, products, routines } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getRoutineSteps } from "@/actions/routines";
import { plural } from "@/lib/routines";
import { RoutineEditor, type Routine } from "@/components/account/routine-editor";
import { SparkIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * MON RITUEL.
 *
 * Toutes les routines sont lues d'un coup, avec leurs étapes, plutôt qu'une
 * routine à la fois : on compare sa routine du matin et celle du soir en
 * changeant d'onglet, et un aller-retour serveur à chaque clic rendrait la
 * comparaison pénible pour trois lignes de données.
 *
 * Les soins proposés à l'ajout sont les références actives et disponibles,
 * par note puis par ventes — pas les mises en avant : une routine se compose,
 * elle ne s'achète pas.
 */
export default async function RituelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/rituel");

  const [rows, candidates] = await Promise.all([
    db.select().from(routines).where(eq(routines.userId, user.id)).orderBy(asc(routines.createdAt)),
    db
      .select({ id: products.id, name: products.name, brandName: brands.name })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(and(eq(products.status, "active"), gt(products.stock, 0)))
      .orderBy(desc(products.ratingAvg), desc(products.salesCount))
      .limit(40),
  ]);

  const withSteps: Routine[] = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      name: r.name,
      moment: r.moment,
      steps: await getRoutineSteps(r.id),
    })),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-display-sm text-ink">Mon rituel</h2>
        <p className="text-[12px] text-muted-2">{plural(withSteps.length, "routine")}</p>
      </div>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
        Composez vos routines et gardez-les. L&apos;ordre des étapes est celui dans lequel
        elles se posent — il change le résultat autant que les produits eux-mêmes.
      </p>

      <div className="mt-8">
        {withSteps.length === 0 && rows.length === 0 ? (
          <div className="border border-dashed border-stone-2 px-6 py-12 text-center">
            <SparkIcon size={22} className="mx-auto text-champagne-2" />
            <p className="mt-4 font-display text-[20px] text-ink">Aucune routine pour l&apos;instant</p>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
              Créez-en une ci-dessous — une pour le matin, une pour le soir, une pour l&apos;hiver.
              Vous pouvez en avoir autant que votre peau en demande.
            </p>
          </div>
        ) : null}
        <RoutineEditor routines={withSteps} candidates={candidates} />
      </div>
    </div>
  );
}
