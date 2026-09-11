"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/primitives";
import { loginAction, registerAction, requestPasswordResetAction, resetPasswordAction } from "@/actions/auth";
import { t, type Locale } from "@/i18n";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export function LoginForm({ next, locale = "fr" }: { next?: string; locale?: Locale }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t(locale, "auth.loginEmail")} error={err("email")}>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label={t(locale, "auth.loginPassword")} error={err("password")}>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </Field>
      <div className="-mt-1 flex justify-end">
        <Link
          href={`/mot-de-passe${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-[12px] text-muted transition-colors hover:text-champagne-2"
        >
          {t(locale, "auth.forgot")}
        </Link>
      </div>
      {state && !state.ok && !state.fieldErrors && <p className="text-sm text-error" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? t(locale, "auth.loginPending") : t(locale, "auth.loginSubmit")}
      </button>
      <p className="text-center text-sm text-muted">
        {t(locale, "auth.loginNoAccount")}{" "}
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">
          {t(locale, "footer.links.register")}
        </Link>
      </p>
      <p className="pt-2 text-center text-[11px] text-muted-2">{t(locale, "auth.loginPrivate")}</p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerAction, null);
  const [pw, setPw] = useState("");
  const s = strength(pw);
  const labels = ["Trop court", "Faible", "Correct", "Bon", "Excellent"];
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" error={err("firstName")}>
          <input name="firstName" autoComplete="given-name" required className="field" />
        </Field>
        <Field label="Nom" error={err("lastName")}>
          <input name="lastName" autoComplete="family-name" required className="field" />
        </Field>
      </div>
      <Field label="E-mail" error={err("email")}>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label="Téléphone (facultatif)" error={err("phone")} hint="8 chiffres, ex. 22 345 678">
        <input name="phone" inputMode="tel" autoComplete="tel" className="field" />
      </Field>
      <Field label="Mot de passe" error={err("password")}>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="field"
        />
        <div className="mt-2 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-0.5 flex-1 transition-colors duration-500 ${i < s ? (s <= 1 ? "bg-error" : s === 2 ? "bg-warning" : "bg-success") : "bg-stone"}`} />
          ))}
        </div>
        {pw && <span className="mt-1 block text-xs text-muted">{labels[s]}</span>}
      </Field>
      {state && !state.ok && !state.fieldErrors && <p className="text-sm text-error" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center text-sm text-muted">
        Déjà client ? <Link href="/connexion" className="text-ink underline underline-offset-4">Se connecter</Link>
      </p>
    </form>
  );
}

/**
 * Demander un lien. Le message de retour est volontairement le même que
 * l'adresse existe ou non — ce formulaire n'est pas un annuaire.
 */
export function RequestPasswordResetForm({ locale = "fr" }: { locale?: Locale }) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label={t(locale, "auth.resetRequestField")} error={err("email")}>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      {state?.ok && (
        <p className="border-l-2 border-success bg-success-soft px-4 py-3 text-[13px] leading-relaxed text-success" role="status">
          {state.message}
        </p>
      )}
      {state && !state.ok && !state.fieldErrors && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? t(locale, "auth.resetRequestPending") : t(locale, "auth.resetRequestSubmit")}
      </button>
      <p className="text-center text-sm text-muted">
        {t(locale, "auth.resetRequestRemember")}{" "}
        <Link href="/connexion" className="text-ink underline underline-offset-4">
          {t(locale, "footer.links.account")}
        </Link>
      </p>
      <p className="pt-2 text-center text-[11px] text-muted-2">
        {t(locale, "auth.resetRequestExpiry")}
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token, locale = "fr" }: { token: string; locale?: Locale }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const [pw, setPw] = useState("");
  const s = strength(pw);
  const labels = ["Trop court", "Faible", "Correct", "Bon", "Excellent"];
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field label={t(locale, "auth.resetPassword")} error={err("password")}>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="field"
        />
        <div className="mt-2 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 transition-colors duration-500 ${i < s ? (s <= 1 ? "bg-error" : s === 2 ? "bg-warning" : "bg-success") : "bg-stone"}`}
            />
          ))}
        </div>
        {pw && <span className="mt-1 block text-xs text-muted">{labels[s]}</span>}
      </Field>
      <Field label={t(locale, "auth.resetConfirm")} error={err("confirm")}>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </Field>
      {state && !state.ok && !state.fieldErrors && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? t(locale, "auth.resetPending") : t(locale, "auth.resetSubmit")}
      </button>
      <p className="pt-2 text-center text-[11px] text-muted-2">
        {t(locale, "auth.resetDevices")}
      </p>
    </form>
  );
}
