"use server";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { brands, products, routineSteps, routines } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, MESSAGES, ok, zodFieldErrors, type ActionResult } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { clientKey } from "@/lib/origin";
import { routineSchema, routineStepSchema } from "@/lib/validation";
import { resolveMoveTarget } from "@/lib/routines";
import { track } from "@/lib/orders";

/**
 * MON RITUEL — les actions.
 *
 * Un principe traverse tout le fichier : **rien n'est écrit sans que la
 * routine appartienne à la personne connectée**. Chaque requête porte donc le
 * couple (routine, utilisateur) dans son `where`, et pas seulement
 * l'identifiant de routine lu dans le formulaire — sinon n'importe qui
 * pourrait réordonner la routine d'un autre en devinant un identifiant.
 */

/** Un champ de formulaire n'est une chaîne que s'il n'est pas un fichier. */
function str(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

/** La routine existe-t-elle, et est-elle à cette personne ? */
async function ownedRoutine(routineId: number, userId: number) {
  return db.query.routines.findFirst({ where: and(eq(routines.id, routineId), eq(routines.userId, userId)) });
}

/**
 * Réécrire les positions en bloc, dans l'ordre donné.
 *
 * Une seule transaction : un réordonnancement à moitié écrit laisserait deux
 * étapes à la même place, et l'ordre affiché dépendrait alors de l'ordre de
 * lecture — donc du hasard.
 */
async function rewritePositions(routineId: number, orderedIds: number[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(routineSteps).set({ position: i }).where(eq(routineSteps.id, orderedIds[i]));
    }
  });
}

export async function routineSaveAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  if (!(await rateLimit(`routine:${await clientKey()}`, 30, 600_000))) return fail(MESSAGES.rateLimited);

  const parsed = routineSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const { intent, name, moment } = parsed.data;

  if (intent === "create") {
    const exists = await db.query.routines.findFirst({
      where: and(eq(routines.userId, me.id), eq(routines.name, name)),
    });
    if (exists) return fail("Une routine porte déjà ce nom.", { name: "Nom déjà utilisé" });
    await db.insert(routines).values({ userId: me.id, name, moment });
    await track("routine.create", { moment }, me.id);
    revalidatePath("/compte/rituel");
    return ok(undefined, `Routine « ${name} » créée.`);
  }

  const routineId = Number(form.get("routineId"));
  const routine = await ownedRoutine(routineId, me.id);
  if (!routine) return fail(MESSAGES.notFound);

  if (intent === "rename") {
    await db.update(routines).set({ name, moment }).where(eq(routines.id, routine.id));
    revalidatePath("/compte/rituel");
    return ok(undefined, "Routine mise à jour.");
  }

  // delete : les étapes tombent avec elle (onDelete: cascade).
  await db.delete(routines).where(eq(routines.id, routine.id));
  await track("routine.delete", { routineId: routine.id }, me.id);
  revalidatePath("/compte/rituel");
  return ok(undefined, `Routine « ${routine.name} » supprimée.`);
}

export async function routineStepAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  if (!(await rateLimit(`routine:${await clientKey()}`, 60, 600_000))) return fail(MESSAGES.rateLimited);

  const parsed = routineStepSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const { intent } = parsed.data;

  const routine = await ownedRoutine(Number(form.get("routineId")), me.id);
  if (!routine) return fail(MESSAGES.notFound);

  const steps = await db
    .select()
    .from(routineSteps)
    .where(eq(routineSteps.routineId, routine.id))
    .orderBy(asc(routineSteps.position));

  if (intent === "add") {
    const productId = Number(form.get("productId"));
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.status, "active")),
      columns: { id: true, name: true },
    });
    if (!product) return fail(MESSAGES.notFound);
    const inserted = await db
      .insert(routineSteps)
      .values({ routineId: routine.id, productId, position: steps.length, note: String(form.get("note") ?? "").slice(0, 200) || null })
      // Le double-clic est inévitable : l'index unique refuse le second, et le
      // message reste le même — la personne n'a pas à comprendre pourquoi.
      .onConflictDoNothing({ target: [routineSteps.routineId, routineSteps.productId] })
      .returning({ id: routineSteps.id });
    await track("routine.step.add", { routineId: routine.id, productId }, me.id);
    revalidatePath("/compte/rituel");
    return ok(undefined, inserted.length ? `« ${product.name} » ajouté à la routine.` : "Ce soin est déjà dans la routine.");
  }

  const stepId = Number(form.get("stepId"));
  const step = steps.find((s) => s.id === stepId);
  if (!step) return fail(MESSAGES.notFound);

  if (intent === "remove") {
    const remaining = steps.filter((s) => s.id !== stepId).map((s) => s.id);
    await db.delete(routineSteps).where(eq(routineSteps.id, stepId));
    await rewritePositions(routine.id, remaining);
    revalidatePath("/compte/rituel");
    return ok(undefined, "Étape retirée.");
  }

  // move : une position cible, ou un cran vers le haut / vers le bas.
  const order = steps.map((s) => s.id);
  const from = order.indexOf(stepId);
  const to = resolveMoveTarget(order, stepId, str(form.get("to")), str(form.get("direction")));
  if (to < 0) return fail(MESSAGES.notFound);
  if (to === from) return ok(undefined, "Ordre inchangé.");

  order.splice(from, 1);
  order.splice(to, 0, stepId);
  await rewritePositions(routine.id, order);
  await track("routine.step.move", { routineId: routine.id, stepId, to }, me.id);
  revalidatePath("/compte/rituel");
  return ok(undefined, "Ordre mis à jour.");
}

/** Les étapes d'une routine, dans l'ordre, avec le produit résolu. */
export async function getRoutineSteps(routineId: number) {
  const steps = await db
    .select({
      id: routineSteps.id,
      position: routineSteps.position,
      note: routineSteps.note,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      image: products.image,
      volume: products.volume,
      priceMillimes: products.priceMillimes,
      stock: products.stock,
    })
    .from(routineSteps)
    .innerJoin(products, eq(products.id, routineSteps.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(eq(routineSteps.routineId, routineId))
    .orderBy(asc(routineSteps.position));
  return steps;
}
