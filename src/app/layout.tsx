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
 * THE LETTERFORMS OF THE HOUSE.
 *
 * Body — Manrope, and Arabic — Noto Kufi, are served through next/font/local:
 * self-hosted, subset, swap, with fallback metrics so the layout never
 * jumps. The display serif (Newsreader) is the house's editorial voice in
 * both roman and italic; the italic face ships through its variable CSS so
 * the two styles share one family and `font-style: italic` never falls back
 * to a synthetic oblique.
 */
const body = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
      weight: "200 800",
    },
    {
      path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2",
      weight: "200 800",
    },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const arabic = localFont({
  src: [
    { path: "../../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/noto-kufi-arabic/files/noto-kufi-arabic-arabic-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-arabic",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Cléopâtre — Beauty in Ritual", template: "%s — Cléopâtre" },
  description:
    "Cléopâtre, maison de beauté dermo-cosmétique à Ezzahra et Hammam-Lif. Peau, cheveu, corps, soleil, bébé : des produits authentiques, sélectionnés et conseillés par nos pharmaciens, livrés partout en Tunisie.",
  applicationName: "Cléopâtre",
  category: "beauty",
  openGraph: { type: "website", locale: "fr_TN", siteName: "Cléopâtre", images: ["/videos/posters/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#0d0b08", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  return (
    <html lang={langFor(locale)} dir={dir} className={`${body.variable} ${arabic.variable}`}>
      <body className={`min-h-dvh bg-paper text-charcoal${dir === "rtl" ? " font-arabic" : ""}`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow-float"
        >
          {locale === "fr" ? "Aller au contenu" : locale === "tn" ? "Rouḥ lel motawa" : "اذهب إلى المحتوى"}
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
