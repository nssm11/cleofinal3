import { Button, H1, InfoBox, Kicker, KeyVal, Para, Rule, Signature, StatusChip, emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";
import { formatDT } from "@/lib/money";

/**
 * THE RECEIPT OF THE MONEY — payment confirmed for offline methods
 * (bank transfer, gift card). COD confirms itself at the door, so it never
 * gets this letter. Concise, warm, one fact (the money is in), one door.
 */

const TEXT = {
  fr: {
    subject: "Paiement reçu — commande {num}",
    kicker: "Paiement confirmé",
    title: "C'est reçu. Merci.",
    body: (name: string) =>
      `Bonjour ${name}, votre paiement a bien été enregistré et votre commande repart en mouvement — la préparation reprend dès cet instant. Vous recevrez les nouvelles de votre colis à chaque étape.`,
    cta: "Suivre ma commande",
    amountLabel: "Montant encaissé",
    orderLabel: "Commande",
    note: "Conservez votre reçu de virement : il est votre preuve, et nous l'archivons avec la commande.",
  },
  tn: {
    subject: "El flous wsselou — commande {num}",
    kicker: "El khlès m2akked",
    title: "Wssel, chokran.",
    body: (name: string) =>
      `Aslema ${name}, el khlès mte3ek t2akked we el commande mte3ek rja3at tihrek — et-te7dîr temchi men heni. Yetb3athouleu el khbar mte3 el koulîs fel kol 7alla.`,
    cta: "Tabbe3 commande mte3i",
    amountLabel: "El mebla9 el mkhlass",
    orderLabel: "Commande",
    note: "Khelli el reçu mte3 el virement m3âk: howa el bouhtha mte3ek, we n7fadhoh m3a el commande.",
  },
} as const;

export type PaymentConfirmedData = {
  firstName: string;
  orderNumber: string;
  amountMillimes: number;
  paymentMethodLabel: string;
};

export function paymentConfirmedSubject(locale: EmailLocale, orderNumber: string) {
  return TEXT[locale].subject.replace("{num}", orderNumber);
}

export function PaymentConfirmedEmail({ data, locale }: { data: PaymentConfirmedData; locale: EmailLocale }) {
  const t = TEXT[locale];
  const subject = t.subject.replace("{num}", data.orderNumber);
  return (
    <EmailShell locale={locale} subject={subject} preheader={t.body(data.firstName).slice(0, 110)}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <StatusChip label={locale === "fr" ? "Paiement confirmé" : "El khlès m2akked"} tone="success" />
      <Para>{t.body(data.firstName)}</Para>

      <InfoBox tone="success">
        <KeyVal label={t.amountLabel} value={<span style={{ fontFamily: EMAIL.serif, fontSize: "18px" }}>{formatDT(data.amountMillimes)}</span>} />
        <KeyVal label={locale === "fr" ? "Mode de paiement" : "Et-ṭari9a el khlès"} value={data.paymentMethodLabel} />
        <KeyVal label={t.orderLabel} value={<span style={{ fontFamily: "monospace" }}>{data.orderNumber}</span>} />
      </InfoBox>

      <Rule />
      <Button href={emailLink(`/compte/commandes`)} wide>
        {t.cta}
      </Button>
      <Para center>
        <span style={{ fontSize: "11.5px", color: EMAIL.muted2 }}>{t.note}</span>
      </Para>
      <Signature locale={locale} />
    </EmailShell>
  );
}
