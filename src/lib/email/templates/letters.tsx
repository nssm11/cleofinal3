import { Button, EditorialQuote, GhostLink, H1, HeroImage, InfoBox, Kicker, Para, Rule, Signature, UniverseTile, emailAsset, emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE WELCOME & THE KEY — two letters with no parcel inside: one that opens
 * the door of the house, one that reopens it when the key is lost.
 */

const TEXT = {
  fr: {
    welcome: {
      subject: "Bienvenue chez Cléopâtre ✨",
      kicker: "Votre compte est ouvert",
      title: "Bienvenue chez vous.",
      greeting: (name: string) => `Bonjour ${name}, votre compte Cléopâtre est ouvert — et avec lui, tout ce qui fait la maison.`,
      body1: "Sept univers, composés avec nos pharmaciens : le Visage, le Corps, les Cheveux, le Solaire, Bébé & Maman, les Compléments, et l'Hygiène & Bien-être. Chacun classé par besoin réel, jamais par argument.",
      body2: "Dans votre espace, vous trouverez bientôt vos rituels enregistrés, votre carnet de fidélité et vos favoris partagés. Prenez le temps de faire le diagnostic de peau — cinq minutes, et nos recommandations vous suivront.",
      cta: "Découvrir la boutique",
      ps: (name: string) => `À très vite au comptoir, ${name}.`,
    },
    password: {
      subject: "Réinitialiser votre mot de passe Cléopâtre",
      kicker: "Sécurité",
      title: "Le temps d'un nouveau mot de passe.",
      intro: (name: string) => `Bonjour ${name},`,
      body:
        "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau — le lien est personnel, usage unique, et expire dans une heure.",
      cta: "Choisir un nouveau mot de passe",
      note:
        "Si vous n'êtes pas à l'origine de cette demande, aucun risque : rien ne change sans un clic de votre part. Vous pouvez simplement ignorer cet e-mail.",
      noteTitle: "Une demande qui ne vient pas de vous ?",
      linkHint: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :",
    },
  },
  tn: {
    welcome: {
      subject: "Marḥba bik fi dâr Cléopâtre ✨",
      kicker: "El compte mte3ek meftou7",
      title: "Marḥba, ed-dâr lek.",
      greeting: (name: string) => `Aslema ${name}, el compte Cléopâtre mte3ek meftou7 — we m3âhou kolchi li yesna3 ed-dâr.`,
      body1: "Seb3a douniya, m3ammalin m3a el pharmaciens mtena: el Wéj, el Ejlism, ech-Cho3r, es-Solaire, el Qseksâr wel-Omm, el Compléments wel-Nadâfa wel-7al. Kol we7da marroûba bel 7âja el 7a9î9iya, mouch bel marketing.",
      body2: "Fi l-espace mte3ek bech tel9â rituels mte3ek, defter el wafa2 wel mfaḍla el mpartjé. Khoudi wa9tek a3mali diagnostic el jeld — khams da9âyek, wel recommandations mtena yemchiou m3âk.",
      cta: "Chouf el boutique",
      ps: (name: string) => `Bel 3ajel fi el comptoir, ${name}.`,
    },
    password: {
      subject: "Beddel kelmet el 3abbour mte3ek — Cléopâtre",
      kicker: "El amn",
      title: "Kellet kelmet 3abbour jdidé.",
      intro: (name: string) => `Aslema ${name},`,
      body:
        "Talbti beddel kelmet el 3abbour. Noukta 3la el boutoun li te7t bech tikhtar jdîda — el lien howa mte3ek wekhed, marra wahda bech eshte3mel, we yet9ada3 ba3d sâ3a.",
      cta: "Ikhtar kelmet 3abbour jdidé",
      note:
        "Ki el talab mouch mte3ek, ma t5âfche: ma yetbeddel walou men doun nokta mennek. Tenjem tesallim mel barqa hedhi wekhed.",
      noteTitle: "Talab li mouch mennek?",
      linkHint: "El boutoun ma khedamch? Collet el lien hna fi el navigateur:",
    },
  },
} as const;

export type WelcomeData = { firstName: string };
export type PasswordResetData = { firstName: string; resetUrl: string; expiresInMinutes: number };

export function welcomeEmailSubject(locale: EmailLocale) {
  return TEXT[locale].welcome.subject;
}
export function passwordEmailSubject(locale: EmailLocale) {
  return TEXT[locale].password.subject;
}

const UNIVERS = [
  { slug: "visage", label: "Visage", img: "/images/u-visage.jpg" },
  { slug: "corps", label: "Corps", img: "/images/u-corps.jpg" },
  { slug: "cheveux", label: "Cheveux", img: "/images/u-cheveux.jpg" },
  { slug: "solaire", label: "Solaire", img: "/images/u-solaire.jpg" },
] as const;

export function WelcomeEmail({ data, locale }: { data: WelcomeData; locale: EmailLocale }) {
  const t = TEXT[locale].welcome;
  return (
    <EmailShell
      locale={locale}
      subject={t.subject}
      preheader={locale === "fr" ? "Sept univers, une exigence — et un conseil qui vous suit." : "Seb3a douniya, mezyan we7ed — wel nasiḥa temchi m3âk."}
    >
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <div style={{ margin: "18px auto 0", width: "44px", height: "2px", backgroundColor: EMAIL.champagne }} />
      <Para>{t.greeting(data.firstName)}</Para>

      {/* The house, photographed — the letter opens like a storefront. */}
      <HeroImage src={emailAsset("/images/maison.jpg")} alt={locale === "fr" ? "La maison Cléopâtre" : "Ed-dâr Cléopâtre"} width={496} height={330} />

      <Para>{t.body1}</Para>

      {/* The seven rooms — four shown, the boutique holds the rest. */}
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            {UNIVERS.slice(0, 2).map((u) => (
              <UniverseTile key={u.slug} src={emailAsset(u.img)} label={u.label} href={emailLink(`/categorie/${u.slug}`)} />
            ))}
          </tr>
          <tr>
            {UNIVERS.slice(2, 4).map((u) => (
              <UniverseTile key={u.slug} src={emailAsset(u.img)} label={u.label} href={emailLink(`/categorie/${u.slug}`)} />
            ))}
          </tr>
        </tbody>
      </table>
      <div style={{ textAlign: "center", margin: "2px 0 0" }}>
        <a href={emailLink("/boutique")} style={{ fontFamily: EMAIL.sans, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: EMAIL.champagne2, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          {locale === "fr" ? "Voir les sept univers →" : "Chouf es-seb3a douniya →"}
        </a>
      </div>

      <EditorialQuote>{locale === "fr" ? "On ne vous vend pas une routine : on vous la compose, comme au comptoir." : "Ma neb3athoulech routine mel jarâ: nkomlouha lik, bhal ma yedî fel comptoir."}</EditorialQuote>

      <Para>{t.body2}</Para>
      <Button href={emailLink("/boutique")} wide>
        {t.cta}
      </Button>
      <GhostLink href={emailLink("/diagnostic")}>{locale === "fr" ? "Ou commencer par le diagnostic de peau →" : "Wala ebda bel diagnostic el jeld →"}</GhostLink>
      <Rule />
      <Para center>
        <em style={{ fontFamily: EMAIL.serif, fontSize: "15px", color: EMAIL.champagne2 }}>{t.ps(data.firstName)}</em>
      </Para>
      <Signature locale={locale} who={locale === "fr" ? "Nour & toute l'équipe" : "Nour we équipe Cléopâtre"} />
    </EmailShell>
  );
}

export function PasswordResetEmail({ data, locale }: { data: PasswordResetData; locale: EmailLocale }) {
  const t = TEXT[locale].password;
  return (
    <EmailShell locale={locale} subject={t.subject} preheader={t.body.slice(0, 90)}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <Para>{t.intro(data.firstName)}</Para>
      <Para>{t.body}</Para>
      <Button href={data.resetUrl} wide>
        {t.cta}
      </Button>
      <div style={{ fontFamily: "monospace", fontSize: "10px", wordBreak: "break-all", textAlign: "center", color: EMAIL.muted, margin: "6px 12px 0" }}>
        {data.resetUrl}
      </div>
      <InfoBox tone="warning">
        <p style={{ fontFamily: EMAIL.sans, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: EMAIL.champagne2, margin: 0 }}>
          {t.noteTitle}
        </p>
        <p style={{ fontFamily: EMAIL.sans, fontSize: "13px", lineHeight: "20px", color: EMAIL.charcoal, margin: "8px 0 0" }}>{t.note}</p>
      </InfoBox>
      <Signature locale={locale} />
    </EmailShell>
  );
}
