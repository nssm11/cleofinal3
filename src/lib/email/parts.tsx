import type { ReactNode } from "react";
import { EMAIL } from "./theme";
import type { EmailLocale } from "./theme";
import { formatDT } from "@/lib/money";
import { SITE_URL } from "@/lib/env";

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

/** Shared micro-copy used inside the parts themselves. */
export type EmailCopy = { total: string };
export const emailLink = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
