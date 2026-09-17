"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";
import { Field } from "@/components/ui/primitives";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/actions/auth";
import { useLocale } from "@/lib/i18n/client";
import { DsAlert } from "@/components/feedback/feedback";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t.email} error={err("email")}><input name="email" type="email" required className="field-swiss" /></Field>
      <Field label={t.password} error={err("password")}><input name="password" type="password" required className="field-swiss" /></Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-primary w-full">{pending ? t.logging : t.login}</button>
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Créer un compte</Link>
        <Link href="/mot-de-passe-oublie" className="underline">Oublié ?</Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      <Field label={t.email} error={err("email")}><input name="email" type="email" required className="field-swiss" /></Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      {state?.ok && <p className="border border-success bg-success-soft p-4 font-sans text-[13px]">{t.forgotSent}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "…" : t.forgotCta}</button>
      <Link href="/connexion" className="block text-center font-mono text-[11px] uppercase tracking-[0.06em] underline">{copy.auth.loginCta}</Link>
    </form>
  );
}

export function ResetPasswordForm({ token, invalid }: { token: string; invalid?: boolean }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const { copy } = useLocale();
  const t = copy.auth;
  const router = useRouter();
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  useEffect(() => { if (!invalid && token && state?.ok) router.push("/connexion"); }, [state, router, invalid, token]);
  if (invalid || !token) {
    return <div className="space-y-6"><DsAlert kind="error">{t.resetInvalid}</DsAlert><Link href="/mot-de-passe-oublie" className="btn-primary w-full text-center">Demander un lien</Link></div>;
  }
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <Field label={t.resetPassword} error={err("next")}><input name="next" type="password" minLength={8} required className="field-swiss" /></Field>
      <Field label={t.resetConfirm} error={err("confirm")}><input name="confirm" type="password" minLength={8} required className="field-swiss" /></Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "…" : t.resetCta}</button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerAction, null);
  const [pw, setPw] = useState("");
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Prénom" error={err("firstName")}><input name="firstName" required className="field-swiss" /></Field>
        <Field label="Nom" error={err("lastName")}><input name="lastName" required className="field-swiss" /></Field>
      </div>
      <Field label="E-mail" error={err("email")}><input name="email" type="email" required className="field-swiss" /></Field>
      <Field label="Téléphone" error={err("phone")}><input name="phone" className="field-swiss" /></Field>
      <Field label="Mot de passe" error={err("password")}><input name="password" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} className="field-swiss" /><div className="mt-2 h-[2px] w-full bg-line"><div className="h-full bg-ink" style={{ width: `${Math.min(100, (pw.length / 12) * 100)}%` }} /></div></Field>
      {state && !state.ok && !state.fieldErrors && <DsAlert kind="error">{state.error}</DsAlert>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Création…" : "Créer mon compte"}</button>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">Déjà client ? <Link href="/connexion" className="underline">Se connecter</Link></p>
    </form>
  );
}
