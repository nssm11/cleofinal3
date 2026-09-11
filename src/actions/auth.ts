"use server";
import { and, eq, ne, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { addresses, sessions, users } from "@/db/schema";
import {
  consumePasswordReset,
  createPasswordReset,
  createSession,
  destroySession,
  destroyUserSessions,
  getCurrentUser,
  hashPassword,
  RESET_TOKEN_TTL_MS,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { fail, MESSAGES, ok, zodFieldErrors, type ActionResult } from "@/lib/api";
import { clientKey, checkOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import {
  addressSchema,
  loginSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  profileSchema,
  registerSchema,
  safeNextPath,
} from "@/lib/validation";
import { audit } from "@/lib/orders";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/mail";
import { SITE_URL } from "@/lib/env";
import { LOCALE_COOKIE, localeCookieOptions, readLocale } from "@/lib/locale";

export async function loginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`login:${await clientKey()}`, 8, 60_000))) return fail(MESSAGES.rateLimited);
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyPassword(parsed.data.password, "scrypt$00$00");
  if (!user || !valid) return fail("E-mail ou mot de passe incorrect.");
  await createSession(user.id, (await headers()).get("user-agent"));
  const next = String(form.get("next") || "");
  redirect(safeNextPath(next, user.role === "customer" ? "/compte" : "/admin"));
}

export async function registerAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`register:${await clientKey()}`, 5, 300_000))) return fail(MESSAGES.rateLimited);
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const exists = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (exists) return fail("Un compte existe déjà avec cet e-mail.", { email: "E-mail déjà utilisé" });
  // La langue affichée au moment de l'inscription devient celle du compte :
  // c'est elle qui décidera de la langue des e-mails, envoyés sans personne
  // derrière l'écran pour la choisir.
  const language = await readLocale();
  const [u] = await db
    .insert(users)
    .values({
      ...parsed.data,
      phone: parsed.data.phone || null,
      locale: language,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning();
  await createSession(u.id, (await headers()).get("user-agent"));
  // The first letter of the relationship. Sent before the redirect so a
  // failure is at least logged; `sendWelcomeEmail` never throws.
  void sendWelcomeEmail({ email: u.email, firstName: u.firstName }, language);
  redirect("/compte");
}

/**
 * Demander un lien. La réponse est la même que le compte existe ou non : ce
 * formulaire ne doit pas devenir l'annuaire des inscrits.
 */
export async function requestPasswordResetAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`pwreset:${await clientKey()}`, 3, 900_000))) return fail(MESSAGES.rateLimited);
  const parsed = passwordResetRequestSchema.safeParse({ email: form.get("email") });
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (user) {
    const token = await createPasswordReset(user.id);
    void sendPasswordResetEmail(
      { email: user.email },
      `${SITE_URL}/mot-de-passe?token=${token}`,
      RESET_TOKEN_TTL_MS / 60_000,
    );
  }
  return ok(
    undefined,
    "Si un compte existe avec cet e-mail, un lien de réinitialisation vient de partir. Il reste valable une heure.",
  );
}

/** Utiliser un lien : nouveau mot de passe, puis toutes les autres sessions tombent. */
export async function resetPasswordAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`pwreset:use:${await clientKey()}`, 6, 900_000))) return fail(MESSAGES.rateLimited);
  const parsed = passwordResetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const userId = await consumePasswordReset(parsed.data.token);
  if (!userId) return fail("Ce lien n'est plus valable. Demandez-en un nouveau.");
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() })
    .where(eq(users.id, userId));
  // A stolen link that has now been used must not leave the previous devices
  // signed in. Everything is dropped, then this browser gets a fresh session.
  await destroyUserSessions(userId);
  await createSession(userId, (await headers()).get("user-agent"));
  await audit(userId, "password.reset", "user", userId);
  redirect("/compte");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  await db.update(users).set({ ...parsed.data, phone: parsed.data.phone || null, updatedAt: new Date() }).where(eq(users.id, me.id));
  revalidatePath("/compte");
  return ok(undefined, "Profil mis à jour.");
}

export async function changePasswordAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const full = await db.query.users.findFirst({ where: eq(users.id, me.id) });
  if (!full || !(await verifyPassword(parsed.data.current, full.passwordHash))) return fail("Mot de passe actuel incorrect.", { current: "Incorrect" });
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: await hashPassword(parsed.data.next), updatedAt: new Date() }).where(eq(users.id, me.id));
    // A password change is usually a reaction to a suspected compromise: every
    // other session must die with it, otherwise an attacker keeps a valid 30-day
    // cookie. The current session is kept so the user is not logged out.
    const currentId = (await cookies()).get(SESSION_COOKIE)?.value;
    await tx.delete(sessions).where(and(eq(sessions.userId, me.id), currentId ? ne(sessions.id, currentId) : sql`true`));
  });
  return ok(undefined, "Mot de passe modifié. Les autres appareils ont été déconnectés.");
}

export async function saveAddressAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const id = Number(form.get("id") || 0);
  const data = { ...parsed.data, line2: parsed.data.line2 || null, postalCode: parsed.data.postalCode || null, label: String(form.get("label") || "Domicile"), isDefault: form.get("isDefault") === "on" };
  // Clearing the old default and setting the new one must be atomic: run
  // separately, a failure in between leaves the customer with no default
  // address, and two concurrent saves could leave two.
  try {
    await db.transaction(async (tx) => {
      if (data.isDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, me.id));
      if (id) {
        const updated = await tx.update(addresses).set({ ...data, updatedAt: new Date() }).where(and(eq(addresses.id, id), eq(addresses.userId, me.id))).returning({ id: addresses.id });
        if (!updated.length) throw new Error(MESSAGES.notFound);
      } else {
        await tx.insert(addresses).values({ ...data, userId: me.id });
      }
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
  revalidatePath("/compte/profil");
  return ok(undefined, "Adresse enregistrée.");
}

export async function deleteAddressAction(id: number): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, me.id)));
  await audit(me.id, "address.delete", "address", id);
  revalidatePath("/compte/profil");
  return ok(undefined, "Adresse supprimée.");
}

/**
 * Changer de langue.
 *
 * Un cookie puis une revalidation de layout : le shell entier — bandeau,
 * en-tête, colophon — se redessine dans l'autre langue, sans rechargement
 * complet ni doublon de routes. Le catalogue garde un seul slug par produit.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("locale") ?? "");
  const next = raw === "tn" ? "tn" : raw === "fr" ? "fr" : null;
  if (!next) return;
  const store = await cookies();
  const attributes = localeCookieOptions();
  if (store.get(LOCALE_COOKIE)?.value === next) return;
  store.set(LOCALE_COOKIE, next, attributes);
  revalidatePath("/", "layout");
}
