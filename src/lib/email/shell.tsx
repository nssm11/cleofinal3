import { Body, Column, Head, Html, Preview, Row, Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL, type EmailLocale } from "./theme";
import { SITE_URL } from "@/lib/env";

/**
 * THE ENVELOPE OF THE HOUSE — the shell around every transactional e-mail.
 *
 * Soft beige ground, a cream card, a typographic logotype up top (e-mail
 * clients kill web-fonts and block images; letters never fail), and a dark
 * colophon at the foot: address, social links, the legal line. Same margin
 * grammar as the site; nothing wider than 560 px.
 */
const wordmark = (light: boolean) => (
  <div style={{ textAlign: "center", padding: "4px 0 0" }}>
    <span
      style={{
        fontFamily: EMAIL.serif,
        fontSize: "30px",
        fontWeight: 300,
        letterSpacing: "0.12em",
        color: light ? "#faf6ec" : EMAIL.ink,
      }}
    >
      Cléopâtre
    </span>
    <div
      style={{
        ...EMAIL.microCaps,
        color: light ? "#cbb078" : "#988b72",
        marginTop: "4px",
        letterSpacing: "0.42em",
        fontSize: "8px",
      }}
    >
      Espace Santé Beauté
    </div>
  </div>
);

export function EmailShell({
  locale,
  subject,
  preheader,
  children,
}: {
  locale: EmailLocale;
  subject: string;
  preheader?: string;
  children: ReactNode;
}) {
  const dir = "ltr";
  return (
    <Html lang={locale === "fr" ? "fr" : "aeb-TN"} dir={dir}>
      <Head>
        <meta />
        <title>{subject}</title>
      </Head>
      <Preview>{preheader ?? subject}</Preview>
      <Body style={{ backgroundColor: EMAIL.bg, margin: "0", padding: "28px 12px", fontFamily: EMAIL.sans }}>
        <Section style={{ maxWidth: `${EMAIL.width}px`, margin: "0 auto" }}>
          {/* The header band */}
          <Section style={{ backgroundColor: EMAIL.card, borderBottom: `1px solid ${EMAIL.cardEdge}` }}>
            <Row>
              <Column align="center" style={{ padding: "26px 24px 18px" }}>
                {wordmark(false)}
                <div style={{ margin: "16px auto 0", width: "56px", height: "2px", backgroundColor: EMAIL.champagne }} />
              </Column>
            </Row>
          </Section>

          {/* The letter */}
          <Section style={{ backgroundColor: EMAIL.card, border: `1px solid ${EMAIL.cardEdge}`, borderTop: "0" }}>
            <div style={{ padding: "8px 32px 40px", direction: dir }}>{children}</div>
          </Section>

          {/* The colophon */}
          <Section style={{ backgroundColor: EMAIL.dark, border: `1px solid ${EMAIL.dark}`, borderTop: "0" }}>
            <Row>
              <Column align="center" style={{ padding: "30px 32px 10px" }}>
                {wordmark(true)}
              </Column>
            </Row>
            <Row>
              <Column align="center" style={{ padding: "6px 32px 6px" }}>
                <div style={{ fontSize: "11px", lineHeight: "19px", color: "rgba(246,241,230,0.55)" }}>
                  Cléopâtre — Espace Santé Beauté
                  <br />
                  Avenue Habib Bourguiba, Ezzahra 2034 — Tunisie
                  <br />
                  {locale === "fr" ? "Tél." : "Tel."} <a href="tel:+21671450210" style={{ color: EMAIL.champagne3, textDecoration: "none" }}>+216 71 450 210</a>{" "}
                  · <a href="mailto:bonjour@cleopatre.tn" style={{ color: EMAIL.champagne3, textDecoration: "none" }}>bonjour@cleopatre.tn</a>
                </div>
              </Column>
            </Row>
            <Row>
              <Column align="center" style={{ padding: "10px 32px 10px" }}>
                <div style={{ fontFamily: EMAIL.sans, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  <a href="https://www.instagram.com/cleopatre.tn" style={{ color: "#efe8da", textDecoration: "none", margin: "0 10px" }}>Instagram</a>
                  <span style={{ color: "rgba(246,241,230,0.3)" }}>·</span>
                  <a href="https://www.facebook.com/cleopatre.tn" style={{ color: "#efe8da", textDecoration: "none", margin: "0 10px" }}>Facebook</a>
                  <span style={{ color: "rgba(246,241,230,0.3)" }}>·</span>
                  <a href={`${SITE_URL}/aide`} style={{ color: "#efe8da", textDecoration: "none", margin: "0 10px" }}>
                    {locale === "fr" ? "Aide & FAQ" : "Emsa3da"}
                  </a>
                </div>
              </Column>
            </Row>
            <Row>
              <Column align="center" style={{ padding: "8px 40px 30px" }}>
                <div style={{ fontSize: "10px", lineHeight: "16px", color: "rgba(246,241,230,0.38)" }}>
                  {locale === "fr"
                    ? "Vous recevez cet e-mail car vous avez un compte ou une commande chez Cléopâtre. Vos données ne sont ni revendues ni partagées — consultez notre politique de confidentialité."
                    : "Enti waslet el e-mail hedhi a7n 3andek compte wala commande 3and Cléopâtre. Ma3lomat mte3ek yetbîchou wala yetpartajou — chouf el politique de confidentialité mtena."}
                </div>
              </Column>
            </Row>
          </Section>

          <Row>
            <Column align="center" style={{ padding: "18px 0 0" }}>
              <div style={{ fontSize: "10px", color: "#988b72", letterSpacing: "0.06em" }}>
                © {new Date().getFullYear()} Cléopâtre — Ezzahra · Hammam-Lif
              </div>
            </Column>
          </Row>
        </Section>
      </Body>
    </Html>
  );
}
