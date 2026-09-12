import { Button, GhostLink, H1, InfoBox, Kicker, KeyVal, OrderTable, Para, Rule, Signature, type EmailOrderItem } from "../parts";
import { emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE CARE LETTERS — everything that is not an order and not a ticket, but
 * still deserves the house's stationery: « your product is back », the gentle
 * follow-ups after a delivery, the ritual reminder, the subscriber's cadence.
 */

const TEXT = {
  fr: {
    restock: {
      subject: "De retour au comptoir — {name}",
      kicker: "En stock",
      title: "Il est revenu. Nous vous avons gardé une place.",
      body: "Vous nous aviez demandé de vous prévenir : la référence que vous attendiez est de retour en quantité limitée. Les clientes abonnées ont bénéficié d'une priorité de 24 h — le stock est maintenant ouvert à toutes.",
      cta: "En profiter maintenant",
      note: "Pas de panique si le stock repart : remettez une alerte, nous vous rappellerons au prochain réassort.",
      label: "Produit",
    },
    careFeedback: {
      subject: "Commande {num} — comment vos soins se passent-ils ?",
      kicker: "Quelques jours après",
      title: "Votre peau a-t-elle répondu ?",
      body:
        "Une routine se juge à deux semaines, pas à deux jours. Si un soin vous surprend, en bien ou en doute, dites-le-nous : nous ajustons le conseil comme en boutique. Et si tout va bien, un mot d'encouragement à la pharmacienne qui l'a choisi ne la laissera pas indifférente.",
      cta: "Laisser un avis (30 secondes)",
      tipsTitle: "Le geste juste, en résumé",
    },
    careFollowup: {
      subject: "Deux semaines plus tard — la suite logique",
      kicker: "Votre rituel, à l'écoute",
      title: "Votre peau a pris le rythme. La suite ?",
      body:
        "Après quinze jours, une routine montre ses vrais résultats — et ses vrais manques. Voici ce que nous ajouterions à la vôtre, d'après ce que vous avez commandé. Un conseil, pas une vente : à vous de voir.",
      cta: "Voir ma sélection",
      from: "D'après votre commande",
    },
    ritual: {
      subject: "Votre rituel {moment} vous attend",
      kicker: "Un mot doux",
      title: "Le geste du jour, dans l'ordre.",
      body: "Les rituels ne valent que par la régularité. Votre sélection vous attend, geste par geste, dans votre compte. Cinq minutes ce matin — votre peau vous remerciera ce soir.",
      cta: "Ouvrir mon rituel",
      steps: "Vos gestes du jour",
      none: "Votre rituel est encore vide — ajoutez-y un produit depuis la boutique.",
    },
    subscription: {
      subject: "Votre réassort Cléopâtre est parti — {num}",
      kicker: "Abonnement",
      title: "Vos essentiels sont en route.",
      body:
        "Votre abonnement vient de préparer votre commande : les références habituelles, au dernier prix, avec vos avantages d'abonnée. Le paiement se fait à la réception comme d'habitude — et le prochain envoi suit au calendrier que vous avez choisi.",
      cta: "Voir la commande",
      next: "Prochain envoi prévu",
      manage: "Gérer mon abonnement (pause, saut, fréquence)",
    },
  },
  tn: {
    restock: {
      subject: "Rja3 lel comptoir — {name}",
      kicker: "Famma",
      title: "Rja3. We 7azznallek plâsse.",
      body: "Talbetna nellemoulek: el référence li kenet tnastâha rja3at b kammiyet ma7douda. El mabattalât 9ablo el awweliya mte3 24 sâ3a — tawa el stock mftou7 lel kol.",
      cta: "Ennafa3 bih tawa",
      note: "Ki el yefrigh men jdid, a3wéd el alerta — w nellemoulek fi et-tawfîr el jây.",
      label: "Produit",
    },
    careFeedback: {
      subject: "Commande {num} — kifah el 3inâya mte3ek sâre?",
      kicker: "Ba3d chwaya youm",
      title: "Jeldik rawwe7lek?",
      body:
        "Routîn yet7kém fîh ba3d simmâyten, wela ba3d joumen. Ki ken produit 3jbek — fel khayr wala fel chekk —oulelna: n3addloû el nasiḥa kifma fi el boutique. We ki kolchi mzyen, kelmet da3m lel pharmasienne li ekhtâretou yetfra7 biha.",
      cta: "A3ṭînâ ra2yek (30 tsâniya)",
      tipsTitle: "El khotoua es-se7î7a, bel ikhtiṣâr",
    },
    careFollowup: {
      subject: "Ba3d simtên — ech-chouâ el menṭi9î",
      kicker: "Rituel mte3ek, na7na fel khatr",
      title: "Jeldik l9â et-tirâm. We ba3d?",
      body:
        "Ba3d khams 3achr youm, en-rotîne werrik netâ2ej el 7a9î9iya — wel n9âyiṣ 7attâ. Hna ken nziidoû 3la mte3ek, men el commande mte3ek. Nasiḥa, mouch be3a: el 9arâr 3andek.",
      cta: "Chouf el khtîra mte3i",
      from: "Men commande mte3ek",
    },
    ritual: {
      subject: "Rotîn {moment} mte3ek yestannâk",
      kicker: "Kelma leflîfa",
      title: "Khotouat el youm, bel tartîb.",
      body: "Er-rotîne ma ynfe3ch ghir bel istimrâr. El khtîra mte3ek testa nnâk, khotoua b khotoua, fi compte mte3ek. Khams da9âyek el sbâh — jeldek yetchoukrelek el mcha.",
      cta: "Ifta7 rituel mte3i",
      steps: "Khotouât el youm",
      none: "Rotîn mte3ek mazo khâwi — zîd produit mel boutique.",
    },
    subscription: {
      subject: "Et-tawfîr mte3ek Cléopâtre yetb3atth — {num}",
      kicker: "Abonnement",
      title: "Assassiyyâtek 3la eṭ-ṭorî9.",
      body:
        "Abonnement mte3ek jayyez commande mte3ek: el références el ma3lifa, bel akher thmen, m3a azâyâ el mabattla. El khlès 3and el liwsoun kif el âda — wel envoi el jây bel calendrier li ekhtâriti.",
      cta: "Chouf el commande",
      next: "Envoi el jây",
      manage: "Msîyet abonnement (pause, saut, wâtm)",
    },
  },
} as const;

export type ExperienceEmailKind = "restock_available" | "care_feedback" | "care_followup" | "ritual_reminder" | "subscription_order";

export type RestockData = { productSlug: string; productName: string; firstName: string };
export type CareFeedbackData = { firstName: string; orderNumber: string; items: EmailOrderItem[]; tips?: string };
export type CareFollowupData = { firstName: string; orderNumber: string; advice: string; suggestion: { name: string; slug: string; shortDescription: string | null } };
export type RitualData = { firstName: string; ritualName: string; moment: "morning" | "evening"; steps: { name: string; brandName: string | null }[] };
export type SubscriptionOrderData = { firstName: string; orderNumber: string; items: EmailOrderItem[]; totalMillimes: number; nextDueAt: string };
type AnyData = Partial<RestockData & CareFeedbackData & CareFollowupData & RitualData & SubscriptionOrderData>;

export function experienceEmailSubject(locale: EmailLocale, kind: ExperienceEmailKind, ctx: { productName?: string; orderNumber?: string; moment?: string; firstName?: string }) {
  const t = TEXT[locale];
  const s =
    kind === "restock_available"
      ? t.restock.subject
      : kind === "care_feedback"
        ? t.careFeedback.subject
        : kind === "care_followup"
          ? t.careFollowup.subject
          : kind === "ritual_reminder"
            ? t.ritual.subject
            : t.subscription.subject;
  return s.replace("{name}", ctx.firstName ?? ctx.productName ?? "Cléopâtre").replace("{num}", ctx.orderNumber ?? "").replace("{moment}", ctx.moment === "evening" ? (locale === "fr" ? "du soir" : "el mcha") : locale === "fr" ? "du matin" : "es-sbâh");
}

export function ExperienceEmail({ kind, data, locale }: { kind: ExperienceEmailKind; data: AnyData; locale: EmailLocale }) {
  const t = TEXT[locale];
  if (kind === "restock_available") {
    const d = data as RestockData;
    const subject = experienceEmailSubject(locale, kind, { productName: d.productName });
    return (
      <EmailShell locale={locale} subject={subject} preheader={d.productName}>
        <Kicker>{t.restock.kicker}</Kicker>
        <H1>{t.restock.title}</H1>
        <Para>{locale === "fr" ? `Bonjour ${d.firstName},` : `Aslema ${d.firstName},`}</Para>
        <Para>{t.restock.body}</Para>
        <InfoBox>
          <KeyVal label={t.restock.label} value={<a href={emailLink(`/produit/${d.productSlug}`)} style={{ color: EMAIL.ink, fontWeight: 700, textDecoration: "none" }}>{d.productName}</a>} />
        </InfoBox>
        <Button href={emailLink(`/produit/${d.productSlug}`)} wide>{t.restock.cta}</Button>
        <Para center>{t.restock.note}</Para>
        <Signature locale={locale} />
      </EmailShell>
    );
  }
  if (kind === "care_feedback") {
    const d = data as CareFeedbackData;
    const subject = experienceEmailSubject(locale, kind, { orderNumber: d.orderNumber });
    return (
      <EmailShell locale={locale} subject={subject} preheader={`${d.orderNumber}`}>
        <Kicker>{t.careFeedback.kicker}</Kicker>
        <H1>{t.careFeedback.title}</H1>
        <Para>{locale === "fr" ? `Bonjour ${d.firstName},` : `Aslema ${d.firstName},`}</Para>
        <Para>{t.careFeedback.body}</Para>
        <OrderTable items={d.items} total={0} t={{ total: "—" }} />
        {d.tips && (
          <InfoBox tone="success">
            <p style={{ ...EMAIL.microCaps, margin: "0 0 8px" }}>{t.careFeedback.tipsTitle}</p>
            <p style={{ fontFamily: EMAIL.sans, fontSize: "13px", lineHeight: "21px", color: EMAIL.charcoal, margin: 0 }}>{d.tips}</p>
          </InfoBox>
        )}
        <Button href={emailLink("/compte/commandes")} wide>{t.careFeedback.cta}</Button>
        <Signature locale={locale} />
      </EmailShell>
    );
  }
  if (kind === "care_followup") {
    const d = data as CareFollowupData;
    const subject = experienceEmailSubject(locale, kind, {});
    return (
      <EmailShell locale={locale} subject={subject} preheader={`${t.careFollowup.from} ${d.orderNumber}`}>
        <Kicker>{t.careFollowup.kicker}</Kicker>
        <H1>{t.careFollowup.title}</H1>
        <Para>{locale === "fr" ? `Bonjour ${d.firstName},` : `Aslema ${d.firstName},`}</Para>
        <Para>{t.careFollowup.body}</Para>
        <Rule />
        <p style={{ ...EMAIL.microCaps, textAlign: "center", margin: "0 0 10px" }}>{t.careFollowup.from} {d.orderNumber}</p>
        <div style={{ textAlign: "center" }}>
          <a href={emailLink(`/produit/${d.suggestion.slug}`)} style={{ fontFamily: EMAIL.serif, fontSize: "21px", color: EMAIL.ink, textDecoration: "none" }}>
            {d.suggestion.name}
          </a>
          {d.suggestion.shortDescription && (
            <p style={{ fontFamily: EMAIL.sans, fontSize: "13px", color: EMAIL.muted, margin: "8px 24px 0", lineHeight: "21px" }}>{d.suggestion.shortDescription}</p>
          )}
        </div>
        <Para center>{d.advice}</Para>
        <Button href={emailLink(`/produit/${d.suggestion.slug}`)} wide>{t.careFollowup.cta}</Button>
        <Signature locale={locale} />
      </EmailShell>
    );
  }
  if (kind === "ritual_reminder") {
    const d = data as RitualData;
    const subject = experienceEmailSubject(locale, kind, { moment: d.moment });
    return (
      <EmailShell locale={locale} subject={subject} preheader={d.ritualName}>
        <Kicker>{t.ritual.kicker}</Kicker>
        <H1>{t.ritual.title}</H1>
        <Para>{locale === "fr" ? `Bonjour ${d.firstName},` : `Aslema ${d.firstName},`}</Para>
        <Para>{t.ritual.body}</Para>
        <p style={{ ...EMAIL.microCaps, textAlign: "center", margin: "20px 0 8px" }}>{d.ritualName} — {t.ritual.steps}</p>
        {d.steps.length > 0 ? (
          <ol style={{ margin: "0 auto", padding: 0, listStyle: "none", maxWidth: "320px" }}>
            {d.steps.map((s, i) => (
              <li key={i} style={{ fontFamily: EMAIL.sans, fontSize: "13.5px", lineHeight: "22px", color: EMAIL.charcoal, marginBottom: "6px" }}>
                <span style={{ fontFamily: EMAIL.serif, fontStyle: "italic", color: EMAIL.champagne2, marginRight: "8px" }}>{String(i + 1).padStart(2, "0")}</span>
                {s.name}
                {s.brandName ? <span style={{ color: EMAIL.muted2, fontSize: "11px" }}> · {s.brandName}</span> : null}
              </li>
            ))}
          </ol>
        ) : (
          <Para center>{t.ritual.none}</Para>
        )}
        <Button href={emailLink("/compte/rituels")} wide>{t.ritual.cta}</Button>
        <Signature locale={locale} />
      </EmailShell>
    );
  }
  // subscription_order
  const d = data as SubscriptionOrderData;
  const subject = experienceEmailSubject(locale, kind, { orderNumber: d.orderNumber });
  return (
    <EmailShell locale={locale} subject={subject} preheader={d.orderNumber}>
      <Kicker>{t.subscription.kicker}</Kicker>
      <H1>{t.subscription.title}</H1>
      <Para>{locale === "fr" ? `Bonjour ${d.firstName},` : `Aslema ${d.firstName},`}</Para>
      <Para>{t.subscription.body}</Para>
      <OrderTable items={d.items} total={d.totalMillimes} t={{ total: locale === "fr" ? "Total à régler" : "El mebla9 3and el liwsoun" }} />
      <InfoBox>
        <KeyVal label={t.subscription.next} value={d.nextDueAt} />
      </InfoBox>
      <Button href={emailLink(`/suivi?n=${encodeURIComponent(d.orderNumber)}`)} wide>{t.subscription.cta}</Button>
      <GhostLink href={emailLink("/compte/abonnement")}>{t.subscription.manage}</GhostLink>
      <Signature locale={locale} />
    </EmailShell>
  );
}
