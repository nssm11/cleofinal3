import type { ReactNode } from "react";
import { EMAIL } from "./theme";
import type { EmailLocale } from "./theme";
import { formatDT } from "@/lib/money";
import { emailAsset as centralEmailAsset, emailLink as centralEmailLink } from "@/lib/media-email";

/** The small type blocks the letters are composed of — same voice as the site. */

export function Kicker({ children }: { children: ReactNode }) {
  return <p style={{ ...EMAIL.microCaps, margin: "26px 0 0", textAlign: "center" }}>{children}</p>;
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: EMAIL.serif,
        fontSize: "26px",
        lineHeight: "1.25",
        fontWeight: 500,
        color: EMAIL.ink,
        margin: "10px 0 0",
        textAlign: "center",
      }}
    >
      {children}
    </h1>
  );
}

export function Para({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <p
      style={{
        fontFamily: EMAIL.sans,
        fontSize: "14px",
        lineHeight: "24px",
        color: EMAIL.charcoal,
        margin: "18px 0 0",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </p>
  );
}

export function Rule({ color = EMAIL.cardEdge }: { color?: string }) {
  return <div style={{ height: "1px", backgroundColor: color, margin: "28px auto", maxWidth: "440px" }} />;
}

export function Button({ href, children, wide }: { href: string; children: ReactNode; wide?: boolean }) {
  return (
    <div style={{ margin: "26px 0 6px", textAlign: "center" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          minWidth: wide ? "86%" : "auto",
          padding: "15px 34px",
          backgroundColor: EMAIL.ink,
          color: "#f2ecdf",
          fontFamily: EMAIL.sans,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          textDecoration: "none",
          borderRadius: "2px",
        }}
      >
        {children}
      </a>
    </div>
  );
}

export function GhostLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p style={{ fontFamily: EMAIL.sans, fontSize: "12px", margin: "14px 0 0", textAlign: "center" }}>
      <a href={href} style={{ color: EMAIL.muted, textDecoration: "underline", textUnderlineOffset: "3px" }}>
        {children}
      </a>
    </p>
  );
}

export function InfoBox({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const bg = tone === "success" ? "#ece1c6" : tone === "warning" ? "#f0e4cc" : "#f2ecdf";
  const edge = tone === "success" ? "#ddd0ab" : tone === "warning" ? "#e4d3ae" : EMAIL.cardEdge;
  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${edge}`, borderRadius: "3px", padding: "16px 20px", margin: "22px 0 0" }}>
      {children}
    </div>
  );
}

export function KeyVal({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ marginBottom: "8px", fontFamily: EMAIL.sans }}>
      <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: EMAIL.muted2, fontWeight: 700 }}>
        {label}
      </span>
      <div style={{ fontSize: "13px", lineHeight: "20px", color: EMAIL.ink, marginTop: "2px" }}>{value}</div>
    </div>
  );
}

export type EmailOrderItem = { name: string; brandName?: string | null; quantity: number; lineTotalMillimes: number };

export function OrderTable({ items, total, t }: { items: EmailOrderItem[]; total: number; t: EmailCopy }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "22px 0 0", borderCollapse: "collapse" }}>
      <tbody>
        {items.map((it, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${EMAIL.cardEdge}` }}>
            <td style={{ padding: "10px 0", fontFamily: EMAIL.sans, fontSize: "13px", color: EMAIL.ink, lineHeight: "19px" }}>
              {it.brandName ? <span style={{ color: EMAIL.muted2, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase" }}>{it.brandName}</span> : null}
              <div style={{ marginTop: it.brandName ? "2px" : 0 }}>{it.name}</div>
            </td>
            <td width="54" align="center" style={{ padding: "10px 4px", fontFamily: EMAIL.sans, fontSize: "12px", color: EMAIL.muted, whiteSpace: "nowrap" }}>
              ×{it.quantity}
            </td>
            <td width="86" align="right" style={{ padding: "10px 0", fontFamily: EMAIL.sans, fontSize: "13px", color: EMAIL.ink, whiteSpace: "nowrap" }}>
              {formatDT(it.lineTotalMillimes)}
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ padding: "12px 0 0", fontFamily: EMAIL.sans, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: EMAIL.muted2, fontWeight: 700 }}>
            {t.total}
          </td>
          <td />
          <td align="right" style={{ padding: "12px 0 0", fontFamily: EMAIL.serif, fontSize: "16px", color: EMAIL.ink }}>
            {formatDT(total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function StatusChip({ label, tone = "ink" }: { label: string; tone?: "ink" | "success" | "warning" | "error" }) {
  const palette =
    tone === "success"
      ? { bg: EMAIL.success, fg: "#f6f1e6" }
      : tone === "warning"
        ? { bg: EMAIL.champagne, fg: "#faf6ec" }
        : tone === "error"
          ? { bg: EMAIL.error, fg: "#faf6ec" }
          : { bg: EMAIL.ink, fg: "#f2ecdf" };
  return (
    <div style={{ textAlign: "center", margin: "20px 0 0" }}>
      <span
        style={{
          display: "inline-block",
          padding: "9px 22px",
          backgroundColor: palette.bg,
          color: palette.fg,
          fontFamily: EMAIL.sans,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          borderRadius: "2px",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function Signature({ locale, who = "L’équipe Cléopâtre" }: { locale: EmailLocale; who?: string }) {
  return (
    <div style={{ marginTop: "34px", textAlign: "center" }}>
      <div style={{ margin: "0 auto 12px", width: "40px", height: "1px", backgroundColor: EMAIL.champagne }} />
      <div
        style={{
          fontFamily: EMAIL.serif,
          fontStyle: "italic",
          fontSize: "15px",
          color: EMAIL.champagne2,
          letterSpacing: "0.04em",
        }}
      >
        {locale === "fr" ? who : "Équipe Cléopâtre"}
      </div>
    </div>
  );
}

/* ── Imagery & the editorial blocks ────────────────────────────────────── */

/** Email-safe image: explicit dimensions, alt text, no layout surprises. */
export function Img({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <img
      src={centralEmailAsset(src)}
      alt={alt}
      width={width}
      height={height}
      style={{ width: "100%", maxWidth: `${width}px`, height: "auto", display: "block", borderRadius: "4px" }}
    />
  );
}

/** Full-bleed editorial image inside the letter card. */
export function HeroImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <div style={{ margin: "22px -32px 0" }}>
      <img
        src={centralEmailAsset(src)}
        alt={alt}
        width={width}
        height={height}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}

/** A small product line with its real photograph. */
export type EmailProductLine = EmailOrderItem & { image?: string | null };

export function ProductLine({ it, link, t }: { it: EmailProductLine; link?: string; t: EmailCopy }) {
  const img = it.image;
  return (
    <tr style={{ borderBottom: `1px solid ${EMAIL.cardEdge}` }}>
      <td style={{ padding: "12px 10px 12px 0", verticalAlign: "middle", width: 64 }}>
        {img ? (
          <img
            src={centralEmailAsset(img)}
            alt={it.name}
            width={64}
            height={64}
            style={{ width: 64, height: 64, objectFit: "cover", display: "block", borderRadius: "4px", backgroundColor: EMAIL.paper }}
          />
        ) : (
          <div style={{ width: 64, height: 64, backgroundColor: EMAIL.champagneSoft, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: EMAIL.serif, fontSize: 22, color: EMAIL.champagne2 }}>C</span>
          </div>
        )}
      </td>
      <td style={{ padding: "12px 10px 12px 0", verticalAlign: "middle", fontFamily: EMAIL.sans }}>
        {it.brandName ? (
          <span style={{ color: EMAIL.muted2, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", display: "block" }}>{it.brandName}</span>
        ) : null}
        <div style={{ fontSize: "13.5px", lineHeight: "19px", color: EMAIL.ink, marginTop: it.brandName ? "3px" : 0 }}>
          {link ? <a href={link} style={{ color: EMAIL.ink, textDecoration: "none" }}>{it.name}</a> : it.name}
        </div>
        <div style={{ fontSize: "11px", color: EMAIL.muted, marginTop: "3px" }}>×{it.quantity}</div>
      </td>
      <td width="86" align="right" style={{ padding: "12px 0", verticalAlign: "middle", fontFamily: EMAIL.sans, fontSize: "13px", color: EMAIL.ink, whiteSpace: "nowrap" }}>
        {formatDT(it.lineTotalMillimes)}
      </td>
    </tr>
  );
}

/**
 * The order's journey — four stations, the current one wearing champagne.
 * Only ever used with the real statuses the house has.
 */
export function StatusTimeline({ current, labels }: { current: number; labels: string[] }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto 0", maxWidth: "440px" }}>
      <tbody>
        <tr>
          {labels.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <td key={label} align="center" style={{ position: "relative", width: "25%" }}>
                <div
                  style={{
                    width: active ? "10px" : "8px",
                    height: active ? "10px" : "8px",
                    borderRadius: "50%",
                    backgroundColor: active ? EMAIL.champagne : done ? EMAIL.ink : "#d8cdae",
                    border: `1px solid ${active ? EMAIL.champagne : done ? EMAIL.ink : "#cbbd9f"}`,
                    margin: "0 auto",
                  }}
                />
                <div
                  style={{
                    fontSize: "8.5px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: active ? EMAIL.champagne2 : done ? EMAIL.ink : "#a99a7e",
                    marginTop: "8px",
                    fontFamily: EMAIL.sans,
                  }}
                >
                  {label}
                </div>
              </td>
            );
          })}
        </tr>
        <tr>
          <td colSpan={labels.length} style={{ paddingTop: "10px" }}>
            <div style={{ height: "1px", backgroundColor: "#e2d8c2", position: "relative" }}>
              <div style={{ height: "1px", backgroundColor: EMAIL.champagne, width: `${(Math.min(current, labels.length - 1) / (labels.length - 1)) * 100}%` }} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** The OTP, set like a price on a maison window: spaced, serif, unmissable. */
export function OtpCode({ code }: { code: string }) {
  return (
    <div
      style={{
        margin: "24px auto 0",
        maxWidth: "320px",
        backgroundColor: EMAIL.paper,
        border: `1px solid ${EMAIL.cardEdge}`,
        borderTop: `3px solid ${EMAIL.champagne}`,
        borderRadius: "4px",
        padding: "22px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: EMAIL.serif,
          fontSize: "40px",
          letterSpacing: "0.42em",
          textIndent: "0.42em",
          color: EMAIL.ink,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {code}
      </div>
    </div>
  );
}

/** Champagne-outlined CTA for the secondary move. */
export function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div style={{ margin: "18px 0 0", textAlign: "center" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          padding: "13px 30px",
          backgroundColor: "transparent",
          color: EMAIL.champagne2,
          border: `1px solid ${EMAIL.champagne}`,
          fontFamily: EMAIL.sans,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          textDecoration: "none",
          borderRadius: "2px",
        }}
      >
        {children}
      </a>
    </div>
  );
}

/** Editorial pull-quote — the house's voice between sections. */
export function EditorialQuote({ children }: { children: ReactNode }) {
  return (
    <div style={{ margin: "26px auto 0", maxWidth: "420px", textAlign: "center", padding: "0 12px" }}>
      <div style={{ width: "34px", height: "1px", backgroundColor: EMAIL.champagne, margin: "0 auto 14px" }} />
      <p style={{ fontFamily: EMAIL.serif, fontStyle: "italic", fontSize: "16px", lineHeight: "26px", color: EMAIL.charcoal, margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

/** One tile of the universes grid — real photography, one word. */
export function UniverseTile({ src, label, href }: { src: string; label: string; href: string }) {
  return (
    <td width="50%" style={{ padding: "5px", verticalAlign: "top" }}>
      <a href={centralEmailLink(href)} style={{ textDecoration: "none", display: "block" }}>
        <img src={centralEmailAsset(src)} alt={label} width={250} height={187} style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px" }} />
        <div
          style={{
            fontFamily: EMAIL.sans,
            fontSize: "9.5px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: EMAIL.muted2,
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          {label}
        </div>
      </a>
    </td>
  );
}

/** Absolute variants, centralized in `lib/media-email.ts` — re-exported so letters keep one import. */
export const emailAsset = centralEmailAsset;
export const emailLink = centralEmailLink;

/** Shared micro-copy used inside the parts themselves. */
export type EmailCopy = { total: string };
