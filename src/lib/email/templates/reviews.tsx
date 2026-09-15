import { Button, GhostLink, H1, Kicker, Para, Rule, Signature, emailAsset, emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE INVITED WITNESS — the review letter.
 *
 * The house never surveys: it invites one precise person, about one precise
 * product, after the parcel has truly been opened. The product wears the
 * letter; the ask is one line, and the door is open either way.
 */

const TEXT = {
  fr: {
    subject: "Votre avis sur {product} nous manquerait",
    kicker: "Un mot de vous",
    title: "Quelques jours de soin — comment ça se passe ?",
    body: (name: string, product: string) =>
      `Bonjour ${name}, votre ${product} vous accompagne depuis quelques jours. Nous publions uniquement les avis de clientes qui ont réellement reçu le produit — le vôtre aurait donc le poids d'une parole vraie, et c'est rare.`,
    cta: "Partager mon expérience",
    ghost: "Voir le produit",
    ps: "Trois lignes suffisent. Ce que vous en attendiez, ce que vous en avez — et si vous recommanderiez.",
  },
  tn: {
    subject: "Ra2y mte3ek 3la {product} ya3melnâ",
    kicker: "Kellet kellem mennek",
    title: "Chwaya youm men el 3inaya — kolchi khair?",
    body: (name: string, product: string) =>
      `Aslema ${name}, el ${product} m3âk men chwaya youm. Na3mllou mel avis men el clients eli welâ ou kolchi bel 7a9î9a — ra2y mte3ek howa kellem asl, we hedhi ma temchich kesîr.`,
    cta: "Sârer el tajriba mte3i",
    ghost: "Chouf el produit",
    ps: "Thalatha souroun kifâya. Ach elli te9enna3ti fih, ach li leltek — we ki terja3i teshtrî wala la.",
  },
} as const;

export type ReviewRequestData = {
  firstName: string;
  productName: string;
  productImage?: string | null;
  productSlug: string;
};

export function reviewRequestSubject(locale: EmailLocale, productName: string) {
  return TEXT[locale].subject.replace("{product}", productName);
}

export function ReviewRequestEmail({ data, locale }: { data: ReviewRequestData; locale: EmailLocale }) {
  const t = TEXT[locale];
  const subject = t.subject.replace("{product}", data.productName);
  return (
    <EmailShell locale={locale} subject={subject} preheader={t.title}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>

      <div style={{ margin: "24px auto 0", maxWidth: "300px" }}>
        {data.productImage ? (
          <img
            src={emailAsset(data.productImage)}
            alt={data.productName}
            width={300}
            height={220}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px", objectFit: "cover", backgroundColor: EMAIL.paper }}
          />
        ) : (
          <div style={{ width: "100%", height: 120, backgroundColor: EMAIL.champagneSoft, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: EMAIL.serif, fontSize: 40, color: EMAIL.champagne2 }}>C</span>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <span style={{ fontFamily: EMAIL.serif, fontSize: "15px", color: EMAIL.ink }}>{data.productName}</span>
        </div>
      </div>

      <Para>{t.body(data.firstName, data.productName)}</Para>
      <Button href={emailLink(`/produit/${data.productSlug}`)} wide>
        {t.cta}
      </Button>
      <GhostLink href={emailLink(`/produit/${data.productSlug}`)}>{t.ghost} →</GhostLink>
      <Rule />
      <Para center>
        <em style={{ fontFamily: EMAIL.serif, fontSize: "14px", color: EMAIL.champagne2 }}>{t.ps}</em>
      </Para>
      <Signature locale={locale} />
    </EmailShell>
  );
}
