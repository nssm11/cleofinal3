"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";
import { Field } from "@/components/ui/primitives";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/actions/auth";
import { useLocale } from "@/lib/i18n/client";
import { DsAlert } from "@/components/feedback/feedback";
import { LedgerSwitch } from "@/components/account/auth-room";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t.email} error={err("email")}>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label={t.password} error={err("password")}>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-solid w-full">
        {pending ? t.logging : t.login}
      </button>
      <div className="space-y-3 border-t border-rule pt-5 text-[0.8125rem]">
        <Link
          href="/mot-de-passe-oublie"
          className="link-underline inline-block whitespace-nowrap text-graphite transition-colors hover:text-ink"
        >
          {t.forgot}
        </Link>
        <p className="font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.16em] text-ash">{t.privateSpace}</p>
      </div>
      <LedgerSwitch
        label={t.noAccount}
        cta={t.createAccount}
        href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`}
      />
    </form>
  );
}

/* ── Mot de passe oublié : demander le lien ─────────────────────────────── */
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      <Field label={t.email} error={err("email")}>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      {state?.ok && (
        <p className="border border-success/30 bg-success-soft px-4 py-3 text-[13px] leading-relaxed text-slate" role="status">
          {t.forgotSent}
        </p>
      )}
      <button disabled={pending} className="btn-solid w-full">
        {pending ? "…" : t.forgotCta}
      </button>
      <p className="text-center text-sm">
        <Link href="/connexion" className="link-underline text-graphite transition-colors hover:text-ink">
          {copy.auth.loginCta}
        </Link>
      </p>
    </form>
  );
}

/* ── Nouveau mot de passe ────────────────────────────────────────────────── */
export function ResetPasswordForm({ token, invalid }: { token: string; invalid?: boolean }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const router = useRouter();
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  useEffect(() => {
    if (!invalid && token && state?.ok) router.push("/connexion");
  }, [state, router, invalid, token]);
  if (invalid || !token) {
    return (
      <div className="space-y-6">
        <DsAlert kind="error">{t.resetInvalid}</DsAlert>
        <Link href="/mot-de-passe-oublie" className="btn-solid w-full text-center">
          {t.forgotCta}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <Field label={t.resetPassword} error={err("next")}>
        <input name="next" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </Field>
      <Field label={t.resetConfirm} error={err("confirm")}>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-solid w-full">
        {pending ? "…" : t.resetCta}
      </button>
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
    <form action={action} className="space-y-6">
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
        <div className="mt-3 flex items-center gap-3" aria-hidden>
          <span className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-px flex-1 transition-colors duration-500 ${i < s ? (s <= 1 ? "bg-error" : s === 2 ? "bg-warning" : "bg-success") : "bg-rule-strong"}`} />
            ))}
          </span>
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ash">{pw ? labels[s] : "8 signes min."}</span>
        </div>
      </Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-solid w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <LedgerSwitch label="Déjà client ?" cta="Se connecter" href="/connexion" />
    </form>
  );
}
