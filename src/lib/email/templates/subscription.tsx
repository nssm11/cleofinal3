import { Button, H1, InfoBox, Kicker, KeyVal, Para, Rule, Signature, StatusChip, emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE QUIET CLOSURE — the subscription stops.
 *
 * No guilt, no "are you sure?" theatrics: the customer chose, the house
 * confirms, the date is stated (the parcel that will NOT arrive), and the
 * door stays open. Premium calm in both directions.
 */

const TEXT = {
  fr: {
    subject: "Votre abonnement Cléopâtre est arrêté",
    kicker: "Abonnement",
    title: "C'est arrêté, comme vous l'avez choisi.",
    body: (name: string) =>
      `Bonjour ${name}, votre abonnement ne sera plus renouvelé. La prochaine livraison prévue n'aura pas lieu, et aucun paiement ne sera demandé après elle. Vos rituels, votre carnet et vos commandes restent bien sûr dans votre espace.`,
    cta: "Voir mon abonnement",
    lastLabel: "Dernière livraison effectuée",
    stopLabel: "Aucune livraison après",
    ghost: "Reprendre mon abonnement",
    ps: (name: string) => `Et si l'envie revient, tout est à sa place — ${name}.`,
  },
  tn: {
    subject: "El abonnement mte3ek tedda3 — Cléopâtre",
    kicker: "El abonnement",
    title: "Tedda3, bel li ekhtârti.",
    body: (name: string) =>
      `Aslema ${name}, el abonnement mte3ek ma yetjawweddch bech. El liwsoun el m9adda ma yetamelch, we walou yet2addem ba3deha. Rituels mte3ek, defter el wafa2 wel commandes mte3ek kollhom bâqin fi espace mte3ek.`,
    cta: "Chouf el abonnement mte3i",
    lastLabel: "A7ar liwsoun mel3ma",
    stopLabel: "Walou ba3d",
    ghost: "Rja3 lel abonnement mte3i",
    ps: (name: string) => `We ki t9eb terja3, kolchi fi ma3ândeh — ${name}.`,
  },
} as const;

export type SubscriptionCancelledData = {
  firstName: string;
  frequencyLabel: string;
  lastDeliveryAt: string;
  nextWasDueAt: string;
};

export function subscriptionCancelledSubject(locale: EmailLocale) {
  return TEXT[locale].subject;
}

export function SubscriptionCancelledEmail({ data, locale }: { data: SubscriptionCancelledData; locale: EmailLocale }) {
  const t = TEXT[locale];
  const subject = t.subject;
  return (
    <EmailShell locale={locale} subject={subject} preheader={t.title}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <StatusChip label={locale === "fr" ? "Abonnement arrêté" : "El abonnement tedda3"} tone="ink" />
      <Para>{t.body(data.firstName)}</Para>

      <InfoBox tone="neutral">
        <KeyVal label={t.stopLabel} value={<span style={{ fontFamily: "monospace" }}>{data.nextWasDueAt}</span>} />
        <KeyVal
          label={locale === "fr" ? "Rythme" : "El irtidm"}
          value={<span style={{ color: EMAIL.muted }}>{data.frequencyLabel}</span>}
        />
      </InfoBox>

      <Rule />
      <Button href={emailLink("/compte/abonnement")} wide>
        {t.cta}
      </Button>
      <Signature locale={locale} />
      <Para center>
        <em style={{ fontFamily: EMAIL.serif, fontSize: "14px", color: EMAIL.champagne2 }}>{t.ps(data.firstName)}</em>
      </Para>
    </EmailShell>
  );
}
