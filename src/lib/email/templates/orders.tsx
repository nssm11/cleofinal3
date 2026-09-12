import { Button, EmailOrderItem, H1, InfoBox, KeyVal, OrderTable, Para, Signature, StatusChip, Kicker, emailLink } from "../parts";
import { EmailShell } from "../shell";
import type { EmailLocale } from "../theme";

/**
 * THE SEVEN LETTERS OF AN ORDER — one layout, seven states of mind.
 *
 * Every status gets its own sentence, chip tone and next step: « confirmée »
 * reassures, « expédiée » hands over the parcel to the carrier, « remboursée »
 * accounts for the money. The order table, the address and the tracking block
 * repeat across all seven so the customer always finds their bearings.
 */

export type OrderEmailKind =
  | "order_confirmed"
  | "order_preparing"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded";

export type OrderEmailData = {
  kind: OrderEmailKind;
  orderNumber: string;
  firstName: string;
  placedAt: string; // pre-formatted date
  items: EmailOrderItem[];
  totalMillimes: number;
  address?: string | null;
  trackingCode?: string | null;
  carrierUrl?: string | null;
  refundAmountMillimes?: number | null;
};


type StatusText = {
  subject: string;
  kicker: string;
  title: string;
  body: string;
  chip: string;
  tone: "ink" | "success" | "warning" | "error";
  cta: string;
  totalLabel: string;
  addressLabel: string;
  trackingLabel: string;
};

const TEXT: Record<EmailLocale, Record<OrderEmailKind, StatusText>> = {
  fr: {
    order_confirmed: {
      subject: "Votre commande {num} est confirmée",
      kicker: "Commande confirmée",
      title: "Votre commande est confirmée.",
      body: "Merci de votre confiance. Nos pharmaciennes ont reçu votre commande et vérifient chaque référence — authenticité, dates, quantité. Elle passe en préparation dès la confirmation du paiement, ou à la livraison si vous avez choisi ce mode.",
      chip: "Confirmée",
      tone: "ink",
      cta: "Voir ma commande",
      totalLabel: "Total",
      addressLabel: "Livraison",
      trackingLabel: "Suivi",
    },
    order_preparing: {
      subject: "Commande {num} — votre colis se prépare",
      kicker: "En préparation",
      title: "Votre commande est en préparation.",
      body: "Votre colis prend forme au comptoir : chaque produit est vérifié, protégé, puis glissé dans un emballage soigné. Nous vous écrivons dès qu'il part en livraison.",
      chip: "En préparation",
      tone: "warning",
      cta: "Suivre ma commande",
      totalLabel: "Total",
      addressLabel: "Livraison",
      trackingLabel: "Suivi",
    },
    order_shipped: {
      subject: "Commande {num} — votre colis est en route",
      kicker: "Expédiée",
      title: "Votre colis a quitté la maison.",
      body: "Le transporteur l'a pris en charge. Suivez-le à tout moment avec le numéro ci-dessous — il arrive en général sous 24 à 72 h selon votre gouvernorat.",
      chip: "Expédiée",
      tone: "success",
      cta: "Suivre le colis",
      totalLabel: "Total",
      addressLabel: "Livraison",
      trackingLabel: "Numéro de suivi",
    },
    order_out_for_delivery: {
      subject: "Commande {num} — il arrive aujourd'hui",
      kicker: "En cours de livraison",
      title: "Votre colis est en route — il arrive aujourd'hui.",
      body: "Le livreur est en tournée dans votre secteur. Prévoyez le règlement à la livraison si c'est votre mode, et gardez un téléphone à portée de main — nos transporteurs appellent avant de sonner.",
      chip: "En cours de livraison",
      tone: "success",
      cta: "Suivre le colis",
      totalLabel: "Total",
      addressLabel: "Livraison",
      trackingLabel: "Numéro de suivi",
    },
    order_delivered: {
      subject: "Commande {num} — livrée, avec tous nos soins",
      kicker: "Livrée",
      title: "Votre commande est livrée.",
      body: "Nous espérons que le colis est arrivé en parfait état. Prenez le temps d'ouvrir chaque soin et de commencer doucement. Dans quelques jours, nous vous enverrons un conseil d'usage — rien de plus.",
      chip: "Livrée",
      tone: "success",
      cta: "Laisser un avis",
      totalLabel: "Total réglé",
      addressLabel: "Livraison",
      trackingLabel: "Suivi",
    },
    order_cancelled: {
      subject: "Commande {num} — annulation confirmée",
      kicker: "Annulée",
      title: "Votre commande a été annulée.",
      body: "C'est fait — rien ne sera expédié et aucun débit n'aura lieu. Si l'annulation n'est pas de votre fait, prévenez-nous par retour de e-mail : nous remettons la commande en route en cinq minutes.",
      chip: "Annulée",
      tone: "error",
      cta: "Nous écrire",
      totalLabel: "Montant",
      addressLabel: "Livraison prévue",
      trackingLabel: "Suivi",
    },
    order_refunded: {
      subject: "Commande {num} — votre remboursement",
      kicker: "Remboursée",
      title: "Votre remboursement est effectué.",
      body: "Le montant a été traité selon votre mode de paiement. Comptez 3 à 7 jours ouvrés selon votre banque. Le détail reste consultable dans votre compte — et la maison vous attend si vous souhaitez revenir.",
      chip: "Remboursée",
      tone: "ink",
      cta: "Voir mes commandes",
      totalLabel: "Montant remboursé",
      addressLabel: "Adresse d'origine",
      trackingLabel: "Suivi",
    },
  },
  tn: {
    order_confirmed: {
      subject: "Commande {num} — tnajzet, marḥba",
      kicker: "Commande m2akkda",
      title: "Commande mte3ek yet2akkdat.",
      body: "Chokran 3la thi9atek. Pharmaciennes mtena 9eblo commande mte3ek we ynajjou 3la kol référence — asl, dates wel kammiyet. Tet7awwel lel te7dîr ki yet2akked el khlès, wala 3and el liwsoun ki hîdhî ekhtâriti.",
      chip: "M2akkda",
      tone: "ink",
      cta: "Chouf commande mte3i",
      totalLabel: "El mebla9",
      addressLabel: "El liwsoun",
      trackingLabel: "Et-tabb3",
    },
    order_preparing: {
      subject: "Commande {num} — el koulîs yet7ayyar",
      kicker: "Fi et-te7dîr",
      title: "Commande mte3ek fi et-te7dîr.",
      body: "El koulîs yet3ammal fi el comptoir: kol produit yetchouf 3lih, yet7émi we yet7at fi emballage mzyen. Nektbouleu ki yetb3ath lel livraison.",
      chip: "Fi et-te7dîr",
      tone: "warning",
      cta: "Tabbe3 commande mte3i",
      totalLabel: "El mebla9",
      addressLabel: "El liwsoun",
      trackingLabel: "Et-tabb3",
    },
    order_shipped: {
      subject: "Commande {num} — el koulîs yehoua aal eṭ-ṭarî9",
      kicker: "Yetb3atth",
      title: "El koulîs mchâ men ed-dâr.",
      body: "Ez-zwân el khlès wekhed. Tabbe3ou bel numéro li te7t, wel âda yetwasslek fi 24 lel 72 sâ3a 3alâ 7sab wilâyek.",
      chip: "Yetb3atth",
      tone: "success",
      cta: "Tabbe3 el koulîs",
      totalLabel: "El mebla9",
      addressLabel: "El liwsoun",
      trackingLabel: "Numéro mte3 et-tabb3",
    },
    order_out_for_delivery: {
      subject: "Commande {num} — yewsslek el youm",
      kicker: "Fi el liwsoun",
      title: "El koulîs 3and es-sewqâ — yewsslek el youm.",
      body: "Ez-zwân fi eṭ-ṭoroun mte3 ed-dâr. Ki ekhlès 3and el liwsoun, a3edd ma t7eb. We khalli et-téléphone 3andek — ez-zwâna yet3allmoû a9bel ma ysenna3ou.",
      chip: "Fi el liwsoun",
      tone: "success",
      cta: "Tabbe3 el koulîs",
      totalLabel: "El mebla9",
      addressLabel: "El liwsoun",
      trackingLabel: "Numéro mte3 et-tabb3",
    },
    order_delivered: {
      subject: "Commande {num} — wessel, bel âfiya",
      kicker: "Tewssel",
      title: "Commande mte3ek tewssel.",
      body: "Némellek ennou el koulîs wessel mezyen wel doun kasaḥ. Khoudi wa9tek fel kolf kol produit we ebda bel leflf. Fi chwaya youm, neb3athouleu nasiḥa mte3 es-ste3mâl — wekhé.",
      chip: "Tewssel",
      tone: "success",
      cta: "A3ṭînâ ra2yik",
      totalLabel: "El mebla9 el medfou3",
      addressLabel: "El liwsoun",
      trackingLabel: "Et-tabb3",
    },
    order_cancelled: {
      subject: "Commande {num} — eltghat",
      kicker: "Etteghlet",
      title: "Commande mte3ek eltghat.",
      body: "Khlaset — ma yetb3atth walou we la kayen khlès. Ki el leghwa mouch mennek, kethbelna 3la barred l-imeyl: nerjjo3ou el commande fi khmas da9âyek.",
      chip: "Etteghlet",
      tone: "error",
      cta: "Ektiblou",
      totalLabel: "El mebla9",
      addressLabel: "El liwsoun el me9ṣed",
      trackingLabel: "Et-tabb3",
    },
    order_refunded: {
      subject: "Commande {num} — el flous yerja3oulek",
      kicker: "Yetreddoû el flous",
      title: "Et-tesleef yet3amel.",
      body: "El mebla9 yetkhallaṣ bel ṭari9a li ekhtâriti. Min 3 lel 7 youm khedma 3alâ banktek. El tafâṣîl tlawjeha fi compte mte3ek — we dâr Cléopâtre testannâk ki terja3i.",
      chip: "Yetredd",
      tone: "ink",
      cta: "Chouf les commandes mte3i",
      totalLabel: "El mebla9 el mardoud",
      addressLabel: "L-adresse el asliya",
      trackingLabel: "Et-tabb3",
    },
  },
};

const EMAIL_LINK = "#87662e";

export function orderEmailSubject(locale: EmailLocale, kind: OrderEmailKind, orderNumber: string): string {
  const t = TEXT[locale === "fr" ? "fr" : "tn"][kind];
  return t.subject.replace("{num}", orderNumber);
}

export function OrderEmail({ data, locale }: { data: OrderEmailData; locale: EmailLocale }) {
  const t = TEXT[locale][data.kind];
  const ctaHref =
    data.kind === "order_shipped" || data.kind === "order_out_for_delivery"
      ? data.carrierUrl ?? emailLink(`/suivi?n=${encodeURIComponent(data.orderNumber)}`)
      : data.kind === "order_confirmed"
        ? emailLink(`/commande/confirmation/${data.orderNumber}`)
        : data.kind === "order_cancelled" || data.kind === "order_refunded"
          ? emailLink("/compte/commandes")
          : emailLink("/suivi");
  const subject = t.subject.replace("{num}", data.orderNumber);
  return (
    <EmailShell locale={locale} subject={subject} preheader={`${t.chip} · ${data.orderNumber}`}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <StatusChip label={t.chip} tone={t.tone} />
      <Para>
        {locale === "fr" ? `Bonjour ${data.firstName},` : `Aslema ${data.firstName},`}
      </Para>
      <Para>{t.body}</Para>

      {(data.trackingCode || data.kind === "order_shipped" || data.kind === "order_out_for_delivery") && data.trackingCode && (
        <InfoBox tone={data.kind === "order_out_for_delivery" ? "success" : "neutral"}>
          <KeyVal label={t.trackingLabel} value={<span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{data.trackingCode}</span>} />
          {data.carrierUrl && (
            <a href={data.carrierUrl} style={{ fontSize: "12px", color: EMAIL_LINK, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              {locale === "fr" ? "Ouvrir le suivi transporteur →" : "Iftaḥ et-tabb3 →"}
            </a>
          )}
        </InfoBox>
      )}

      {data.address && (
        <div style={{ marginTop: "24px" }}>
          <KeyVal label={t.addressLabel} value={data.address} />
        </div>
      )}

      <OrderTable items={data.items} total={data.refundAmountMillimes ?? data.totalMillimes} t={{ total: t.totalLabel }} />

      <div style={{ marginTop: "18px" }}>
        <KeyVal
          label={locale === "fr" ? "Commande" : "Commande"}
          value={
            <>
              <span style={{ fontFamily: "monospace" }}>{data.orderNumber}</span> · {data.placedAt}
            </>
          }
        />
      </div>

      <Button href={ctaHref} wide>
        {t.cta}
      </Button>
      <Para center>
        {locale === "fr"
          ? "Une question sur cette commande ? Répondez simplement à cet e-mail — une pharmacienne vous lira."
          : "3andek so2âl 3la el commande hedhi? Radd 3la el barqa hedhi — we phaRmacienne te9ralek."}
      </Para>
      <Signature locale={locale} />
    </EmailShell>
  );
}

