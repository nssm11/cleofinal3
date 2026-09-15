import { Button, GhostLink, H1, InfoBox, Kicker, OtpCode, Para, Signature, emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE KEY — the single-purpose letter of the door.
 *
 * No campaign, no imagery to compete: one question (is this you?), the
 * code set like a price in a window, the clock (10 minutes), and the quiet
 * reassurance that a wrong code is harmless. When the letter is rendered
 * without a live code (retried after expiry), it says so plainly — it never
 * shows a stale secret.
 */

const TEXT = {
  fr: {
    subject: "Votre code de vérification Cléopâtre",
    kicker: "Vérification de votre adresse",
    title: "Votre espace est presque prêt.",
    body: (name: string) => `Bonjour ${name}, pour ouvrir votre compte, confirmez que cette adresse vous appartient. Saisissez le code ci-dessous dans votre espace — il reste valable dix minutes.`,
    codeLabel: "Votre code de vérification",
    expired: "Ce code n'est plus valable — il a expiré ou a déjà été utilisé. Demandez-en un nouveau, il sera immédiat.",
    cta: "Vérifier mon adresse",
    back: "Aller à mon espace",
    noteTitle: "Vous n'avez pas demandé à créer de compte ?",
    note: "Personne ne peut accéder à votre compte avec ce code : il ne donne que la confirmation de l'adresse. Ignorez simplement cet e-mail, il ne servira à rien.",
    resendHint: "Le code n'arrive pas ? Vérifiez l'indésirable, ou demandez-en un autre depuis votre espace.",
  },
  tn: {
    subject: "Code el vérification mte3ek — Cléopâtre",
    kicker: "Vérification el-adresse",
    title: "Espace mte3ek 9rib yetsayyab.",
    body: (name: string) => `Aslema ${name}, bech tefthi el compte mte3ek, akhed bel mechhared ennou hedhi el adresse mte3ek. Da7kel el code li te7t fi espace mte3ek — yet9ada3 10 da9âyek.`,
    codeLabel: "Code el vérification mte3ek",
    expired: "Hedhi el code ma yet3amelch — et9ada3 wala estehmel. Talab jdid, yetwassellek bel 3ajel.",
    cta: "Verifî adresse mte3i",
    back: "Mchî lel espace mte3i",
    noteTitle: "Mouch ntek eli talba compte?",
    note: "Walou ma yel9a 3la compte mte3ek mel code hedhi: houwa wekhed yesselem el adresse. Tesallim mel barqa hedhi wekhed, ma ykhaddamch.",
    resendHint: "El code ma yewsselch? Chouf el spam, wala talab wa7ed men espace mte3ek.",
  },
} as const;

export type OtpData = {
  firstName: string;
  otpId: number;
  /** Present only when the letter is rendered at send time. */
  code?: string;
  locale: EmailLocale;
};

export function otpEmailSubject(locale: EmailLocale) {
  return TEXT[locale].subject;
}

export function OtpEmail({ data, locale }: { data: OtpData; locale: EmailLocale }) {
  const t = TEXT[locale];
  const subject = t.subject;
  const live = Boolean(data.code);
  return (
    <EmailShell locale={locale} subject={subject} preheader={live ? t.codeLabel : t.expired}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <div style={{ margin: "18px auto 0", width: "44px", height: "2px", backgroundColor: EMAIL.champagne }} />
      <Para>{t.body(data.firstName)}</Para>

      {live ? (
        <>
          <div style={{ ...EMAIL.microCaps, textAlign: "center", margin: "26px 0 0", color: EMAIL.muted2 }}>{t.codeLabel}</div>
          <OtpCode code={data.code!} />
          <Para center>
            <span style={{ color: EMAIL.muted2, fontSize: "12px" }}>{locale === "fr" ? "Valable pendant 10 minutes." : "Yet9ada3 10 da9âyek."}</span>
          </Para>
        </>
      ) : (
        <InfoBox tone="warning">
          <p style={{ fontFamily: EMAIL.sans, fontSize: "13px", lineHeight: "21px", color: EMAIL.charcoal, margin: 0 }}>{t.expired}</p>
        </InfoBox>
      )}

      {live && (
        <Button href={emailLink("/compte/verifie")} wide>
          {t.cta}
        </Button>
      )}
      <GhostLink href={emailLink("/compte/verifie")}>{t.back} →</GhostLink>

      <InfoBox tone="neutral">
        <p style={{ fontFamily: EMAIL.sans, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: EMAIL.champagne2, margin: 0 }}>
          {t.noteTitle}
        </p>
        <p style={{ fontFamily: EMAIL.sans, fontSize: "13px", lineHeight: "20px", color: EMAIL.charcoal, margin: "8px 0 0" }}>{t.note}</p>
      </InfoBox>
      <Para center>
        <span style={{ fontSize: "11.5px", color: EMAIL.muted2 }}>{t.resendHint}</span>
      </Para>
      <Signature locale={locale} />
    </EmailShell>
  );
}
