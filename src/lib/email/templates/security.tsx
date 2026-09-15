import { Button, GhostLink, H1, InfoBox, Kicker, Para, Rule, Signature, StatusChip, emailLink } from "../parts";
import { EmailShell } from "../shell";
import type { EmailLocale } from "../theme";

/**
 * THE SENTINEL — sent when credentials change. Premium in dress, urgent in
 * intent: what changed, when, and — if this was not you — the two doors to
 * walk through. No promotion, no product, no noise around the fact.
 */

const TEXT = {
  fr: {
    subject: "Votre mot de passe Cléopâtre a été modifié",
    kicker: "Sécurité de votre compte",
    title: "Votre mot de passe a été mis à jour.",
    body: (name: string, when: string) =>
      `Bonjour ${name}, le mot de passe de votre compte Cléopâtre a été changé le ${when}. Si c'est vous, rien à faire — votre espace continue de vous attendre.`,
    cta: "Accéder à mon espace",
    notYouTitle: "Ce n'est pas vous ?",
    notYou:
      "Changez immédiatement votre mot de passe depuis votre espace, puis écrivez-nous en répondant à cet e-mail : nous vérifions chaque signalement dans la journée et, si besoin, sécurisons le compte.",
    ghostCta: "Changer mon mot de passe",
    detailLabel: "Moment",
  },
  tn: {
    subject: "Kelmet el 3abbour mte3ek teddelat — Cléopâtre",
    kicker: "Aman el compte mte3ek",
    title: "Kelmet el 3abbour mte3ek teddelat.",
    body: (name: string, when: string) =>
      `Aslema ${name}, kelmet el 3abbour 3la el compte Cléopâtre mte3ek teddlat el ${when}. Ki howa ntek, walou kellsek — espace mte3ek me7kô.`,
    cta: "Mchî lel espace mte3i",
    notYouTitle: "Hedhi mouch ntek?",
    notYou:
      "Beddel kelmet el 3abbour bel 3ajel men espace mte3ek, wela kteblou men l-imeyl hedhi: na3mlou chkol mel 3ajel we ki t9as, nemhimoû el compte.",
    ghostCta: "Beddel kelmet el 3abbour mte3i",
    detailLabel: "El wa9t",
  },
} as const;

export type SecurityChangeData = { firstName: string; when: string; locale: EmailLocale };

export function securityEmailSubject(locale: EmailLocale) {
  return TEXT[locale].subject;
}

export function SecurityChangeEmail({ data, locale }: { data: SecurityChangeData; locale: EmailLocale }) {
  const t = TEXT[locale];
  const subject = t.subject;
  return (
    <EmailShell locale={locale} subject={subject} preheader={t.body(data.firstName, data.when).slice(0, 110)}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <StatusChip label={locale === "fr" ? "Changement confirmé" : "Tbeddél m2akked"} tone="success" />
      <Para>{t.body(data.firstName, data.when)}</Para>

      <div style={{ margin: "22px auto 0", maxWidth: "300px" }}>
        <div style={{ ...({ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#988b72", fontWeight: 700 } as const) }}>{t.detailLabel}</div>
        <div style={{ fontSize: "13px", color: "#211b12", marginTop: "3px", fontFamily: "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" }}>{data.when}</div>
      </div>

      <Rule />
      <Button href={emailLink("/compte/profil")} wide>
        {t.cta}
      </Button>
      <GhostLink href={emailLink("/compte/profil")}>{t.ghostCta} →</GhostLink>

      <InfoBox tone="warning">
        <p style={{ fontFamily: "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#87662e", margin: 0 }}>
          {t.notYouTitle}
        </p>
        <p style={{ fontFamily: "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", fontSize: "13px", lineHeight: "20px", color: "#38322a", margin: "8px 0 0" }}>{t.notYou}</p>
      </InfoBox>
      <Signature locale={locale} who={locale === "fr" ? "L'équipe Cléopâtre" : "Équipe Cléopâtre"} />
    </EmailShell>
  );
}
