import { Button, H1, InfoBox, Kicker, KeyVal, Para, Signature } from "../parts";
import { emailLink } from "../parts";
import { EmailShell } from "../shell";
import { EMAIL, type EmailLocale } from "../theme";

/**
 * THE SUPPORT WINDOW — three short letters for one conversation: « reçu »,
 * « répondu », « réglé ». The ticket number is the thread that ties them; the
 * CTA always leads back to the same page, « Voir mon ticket ».
 */

const TEXT = {
  fr: {
    created: {
      subject: "Ticket {num} — votre message est entre nos mains",
      kicker: "Support",
      title: "Votre demande est ouverte.",
      body: "Nous avons bien reçu votre message et il est confié à l'équipe concernée. Une réponse vous attend sous 12 heures ouvrées — au plus tôt pour les commandes en cours de livraison.",
      cta: "Voir mon ticket",
      numLabel: "Numéro de ticket",
      subjectLabel: "Objet",
      replyLabel: "",
    },
    reply: {
      subject: "Ticket {num} — l'équipe vous a répondu",
      kicker: "Réponse reçue",
      title: "Votre réponse est arrivée.",
      body: "Une membre de l'équipe a pris le temps de vous écrire. Vous pouvez continuer la échange directement depuis votre compte — le ticket reste ouvert tant qu'il le faut.",
      cta: "Lire la réponse",
      numLabel: "Numéro de ticket",
      subjectLabel: "Objet",
      replyLabel: "La réponse",
    },
    resolved: {
      subject: "Ticket {num} — tout est réglé",
      kicker: "Dossier clos",
      title: "Votre demande est résolue.",
      body: "Nous clôturons le ticket — avec l'espoir que tout est désormais clair. Si quelque chose reste en suspens, répondez simplement à cet e-mail : nous rouvrons le dossier sans formalité.",
      cta: "Voir mon ticket",
      numLabel: "Numéro de ticket",
      subjectLabel: "Objet",
      replyLabel: "",
    },
  },
  tn: {
    created: {
      subject: "Ticket {num} — lelna kelmetek",
      kicker: "Support",
      title: "Et-talba mte3ek yet9ablat.",
      body: "El message mte3ek wessel wel 9aṣé 3la el équipe el mezyena. Jawâb lel 12 sâ3ât khdma — we bel 3ajel ki el commande fi et-tlîwâr.",
      cta: "Chouf et-ticket mte3i",
      numLabel: "Numéro et-ticket",
      subjectLabel: "El mawdhou3",
      replyLabel: "",
    },
    reply: {
      subject: "Ticket {num} — l'équipe rawwe7itlek",
      kicker: "Jawâb wessel",
      title: "El jawâb yehoua hna.",
      body: "We7da men el équipe khodhat we9tha bech tekteblek. Tenjem tekkmel el hiwar men compte mte3ek — et-ticket yeb9â meftou7 kemâ lazem.",
      cta: "I9ra el jawâb",
      numLabel: "Numéro et-ticket",
      subjectLabel: "El mawdhou3",
      replyLabel: "El jawâb",
    },
    resolved: {
      subject: "Ticket {num} — kolchi tnajja",
      kicker: "Et-tikyet yetkhallès",
      title: "Et-talba mte3ek yet7allat.",
      body: "Nesaddoû et-ticket bel âmfel ennou kolchi wâde7. Ki ken mazo walou, radd 3la el barqa hedhi: nefta7ou men jedid bel doun khatâwer.",
      cta: "Chouf et-ticket mte3i",
      numLabel: "Numéro et-ticket",
      subjectLabel: "El mawdhou3",
      replyLabel: "",
    },
  },
} as const;

export type TicketEmailKind = "ticket_created" | "ticket_reply" | "ticket_resolved";
export type TicketEmailData = { kind: TicketEmailKind; firstName: string; ticketNumber: string; subject: string; reply?: string };

function num(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}

export function ticketEmailSubject(locale: EmailLocale, kind: TicketEmailKind, ticket: number) {
  const t = TEXT[locale][kind === "ticket_created" ? "created" : kind === "ticket_reply" ? "reply" : "resolved"];
  return t.subject.replace("{num}", num(ticket));
}

export function TicketEmail({ data, locale }: { data: TicketEmailData; locale: EmailLocale }) {
  const t = TEXT[locale][data.kind === "ticket_created" ? "created" : data.kind === "ticket_reply" ? "reply" : "resolved"];
  const subject = t.subject.replace("{num}", data.ticketNumber);
  return (
    <EmailShell locale={locale} subject={subject} preheader={`${t.kicker} · ${data.ticketNumber}`}>
      <Kicker>{t.kicker}</Kicker>
      <H1>{t.title}</H1>
      <Para>{locale === "fr" ? `Bonjour ${data.firstName},` : `Aslema ${data.firstName},`}</Para>
      <Para>{t.body}</Para>
      <InfoBox>
        <KeyVal label={t.numLabel} value={<span style={{ fontFamily: "monospace" }}>{data.ticketNumber}</span>} />
        <KeyVal label={t.subjectLabel} value={data.subject} />
      </InfoBox>
      {data.kind === "ticket_reply" && data.reply && (
        <div
          style={{
            marginTop: "22px",
            borderLeft: `3px solid ${EMAIL.champagne}`,
            backgroundColor: "#f2ecdf",
            padding: "16px 20px",
          }}
        >
          <p style={{ ...EMAIL.microCaps, margin: "0 0 8px" }}>{t.replyLabel}</p>
          <p style={{ fontFamily: EMAIL.sans, fontSize: "13.5px", lineHeight: "22px", color: EMAIL.charcoal, margin: 0, whiteSpace: "pre-wrap" }}>
            {data.reply}
          </p>
        </div>
      )}
      <Button href={emailLink("/compte/support")} wide>
        {t.cta}
      </Button>
      {data.kind === "ticket_resolved" ? (
        <Para center>
          <em style={{ fontFamily: EMAIL.serif, color: EMAIL.champagne2 }}>
            {locale === "fr" ? "Merci de votre confiance — et de votre patience." : "Chokran 3la thi9atek — wel 9aṣr."}
          </em>
        </Para>
      ) : null}
      <Signature locale={locale} who={locale === "fr" ? "Le comptoir — service client" : "El équipe Cléopâtre"} />
    </EmailShell>
  );
}
