import { MAIL, MAIL_FONT_SANS } from "../brand";
import { CARE_FEEDBACK_MAIL, CARE_FOLLOWUP_MAIL } from "../copy";
import { button, emailShell, esc, heading, eyebrow, notice, rule, secondaryLink, text } from "../shell";

/**
 * 14 · DES NOUVELLES (J+2) — demander un avis pendant que c'est frais.
 *
 * L'avertissement sanitaire passe **avant** l'invitation à commenter : si une
 * réaction inhabituelle a lieu, la priorité n'est pas l'avis, c'est le
 * téléphone. L'ordre des blocs n'est pas décoratif.
 */
export function careFeedbackEmail(o: {
  productName: string;
  reviewHref: string;
  adviceHref?: string;
}): { subject: string; html: string } {
  const C = CARE_FEEDBACK_MAIL;
  const subject = C.subject.replace("{name}", o.productName);
  const body = `
    ${eyebrow(C.eyebrow)}
    ${heading(esc(C.title(o.productName)))}
    ${rule("20px 0 24px")}
    ${text(esc(C.body))}
    <div style="text-align:center;margin:26px 0 8px">${button(o.reviewHref, C.cta)}</div>
    ${secondaryLink(o.adviceHref ?? "tel:+21671450210", C.secondary)}
    ${rule("26px 0 18px")}
    ${notice(`<strong style="color:${MAIL.ink}">Avant toute chose :</strong> ${esc(C.notice)}`, "warn")}
  `;
  return { subject, html: emailShell({ subject, preheader: C.preheader, body }) };
}

/**
 * 15 · DIX JOURS APRÈS (J+10) — tenir, pas racheter.
 *
 * Aucune promotion, aucune offre : cette lettre existe pour empêcher un
 * abandon prématuré, pas pour déclencher une seconde commande. Le seul bouton
 * renvoie aux conseils d'usage du produit déjà acheté.
 */
export function careFollowUpEmail(o: {
  productName: string;
  productHref: string;
  adviceHref?: string;
}): { subject: string; html: string } {
  const C = CARE_FOLLOWUP_MAIL;
  const subject = C.subject.replace("{name}", o.productName);
  const body = `
    ${eyebrow(C.eyebrow)}
    ${heading(esc(C.title(o.productName)))}
    ${rule("20px 0 24px")}
    ${text(esc(C.body))}
    <div style="text-align:center;margin:26px 0 8px">${button(o.productHref, C.cta)}</div>
    ${secondaryLink(o.adviceHref ?? "tel:+21671450210", C.secondary)}
    ${rule("26px 0 18px")}
    ${notice(`<strong style="color:${MAIL.ink}">Une règle simple :</strong> ${esc(C.notice)}`, "warn")}
    <p style="margin:18px 0 0;font-family:${MAIL_FONT_SANS};font-size:11.5px;line-height:1.6;color:${MAIL.muted2}">
      ${esc("Ceci est la dernière lettre automatique de cette commande. Ensuite, nous n'écrivons plus que si vous nous écrivez.")}
    </p>
  `;
  return { subject, html: emailShell({ subject, preheader: C.preheader, body }) };
}
