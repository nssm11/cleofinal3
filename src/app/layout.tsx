import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { ToasterProvider } from "@/components/ui/toaster";
import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/lib/i18n/client";
import { LangSync } from "@/components/shell/lang-sync";
import { COPY, getLocale } from "@/lib/i18n/server";
import { dirFor, langFor } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/env";

/**
 * SWISS MODERN — TYPE SYSTEM
 * Geist Sans: neo-grotesk, precise, Swiss clarity. Optical perfection.
 * Geist Mono: data, labels, prices — tabular, measured.
 * No decorative display face. Typography IS the design.
 */
const geistSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Helvetica", "Arial", "sans-serif"],
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CLÉOPÂTRE — Système de soin", template: "%s — CLÉOPÂTRE" },
  description:
    "Système de soin dermo-cosmétique. Visage, cheveux, corps, solaire, bébé — sélection précise, conseil pharmacien, livraison Tunisie.",
  applicationName: "CLÉOPÂTRE",
  category: "beauty",
  openGraph: { type: "website", locale: "fr_TN", siteName: "CLÉOPÂTRE", images: ["/images/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  return (
    <html lang={langFor(locale)} dir={dir} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-bg text-text antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.12em] focus:text-paper"
        >
          Aller au contenu
        </a>
        <LocaleProvider locale={locale} copy={COPY[locale]}>
          <LangSync current={locale} />
          <ToasterProvider>
            <CartProvider>{children}</CartProvider>
          </ToasterProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
