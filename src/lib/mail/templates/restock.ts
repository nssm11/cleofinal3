import { MAIL, MAIL_FONT_SANS, MAIL_FONT_SERIF } from "../brand";
import { RESTOCK_MAIL as C } from "../copy";
import { button, emailShell, esc, heading, eyebrow, notice, rule, text } from "../shell";

/**
 * 13 · DE RETOUR EN STOCK — la promesse tenue.
 *
 * Cette lettre existe parce qu'une autre l'a précédée : quelqu'un a écrit
 * « prévenez-moi », et nous avions promis d'écrire. C'est la seule lettre du
 * système qui soit un engagement pris à l'avance — d'où son ton : pas de
 * relance commerciale, une quantité, une durée, un bouton.
 *
 * Le stock annoncé est volontairement prudent (« quelques exemplaires » plutôt
 * qu'un chiffre) : entre l'envoi et la lecture, la référence peut repartir.
 */
export function restockEmail(o: {
  productName: string;
  brandName?: string | null;
  productHref: string;
  imageHref?: string | null;
  imageAlt?: string;
  priceLabel?: string;
  stock?: number | null;
}): { subject: string; html: string } {
  const subject = C.subject.replace("{name}", o.productName);
  const stockLine =
    typeof o.stock === "number" && o.stock > 0
      ? `<strong style="color:${MAIL.ink}">${o.stock === 1 ? "Un seul exemplaire" : `${o.stock} exemplaires`} en stock.</strong> ${esc(C.notice)}`
      : `<strong style="color:${MAIL.ink}">Le réassort vient d'arriver.</strong> ${esc(C.notice)}`;

  const card = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px">
      <tr>
        ${
          o.imageHref
            ? `<td width="92" valign="top" style="padding-right:16px">
                 <img src="${esc(o.imageHref)}" alt="${esc(o.imageAlt ?? o.productName)}" width="84" height="105"
                      style="display:block;width:84px;height:105px;object-fit:cover;border:1px solid ${MAIL.ground}" />
               </td>`
            : ""
        }
        <td valign="top" style="font-family:${MAIL_FONT_SANS}">
          ${o.brandName ? `<p style="margin:0 0 4px;font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:${MAIL.muted2}">${esc(o.brandName)}</p>` : ""}
          <p style="margin:0;font-family:${MAIL_FONT_SERIF};font-size:19px;line-height:1.3;color:${MAIL.ink}">${esc(o.productName)}</p>
          ${o.priceLabel ? `<p style="margin:8px 0 0;font-size:14px;color:${MAIL.champagne2}">${esc(o.priceLabel)}</p>` : ""}
        </td>
      </tr>
    </table>`;

  const body = `
    ${eyebrow(C.eyebrow)}
    ${heading(esc(C.title(o.productName)))}
    ${rule("20px 0 8px")}
    ${text(esc(C.body))}
    ${card}
    <div style="text-align:center;margin:22px 0 8px">${button(o.productHref, C.cta)}</div>
    ${notice(stockLine, "warn")}
    <p style="margin:20px 0 0;font-family:${MAIL_FONT_SANS};font-size:11.5px;line-height:1.6;color:${MAIL.muted2}">
      ${esc(C.fallbackLabel)}<br />
      <a href="${esc(o.productHref)}" style="color:${MAIL.muted2};word-break:break-all">${esc(o.productHref)}</a>
    </p>
  `;
  return {
    subject,
    html: emailShell({ subject, preheader: C.preheader.replace("{name}", o.productName), body }),
  };
}
