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
import { SmoothScroll } from "@/components/motion/smooth";

/**
 * THE LETTERFORMS OF THE HOUSE.
 *
 * Latin type is served through the variable CSS of its own packages, so the
 * italic, the optical-size axis and the width axis all arrive intact:
 *
 *   · Bodoni Moda        — the couture Didone. Every statement, every price
 *                          of importance, the wordmark of the house.
 *   · Instrument Sans    — the grotesque that runs the interface.
 *   · JetBrains Mono     — every figure, reference, label and status.
 *
 * Arabic is self-hosted through next/font/local: Noto Kufi, subset, with
 * fallback metrics so the layout never jumps when the house speaks Tounsi.
 */
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
  title: { default: "Cléopâtre — Espace Santé Beauté", template: "%s — Cléopâtre" },
  description:
    "Cléopâtre, maison de beauté dermo-cosmétique à Ezzahra et Hammam-Lif. Peau, cheveu, corps, soleil, bébé : des produits authentiques, sélectionnés et conseillés par nos pharmaciens, livrés partout en Tunisie.",
  applicationName: "Cléopâtre",
  category: "beauty",
  openGraph: { type: "website", locale: "fr_TN", siteName: "Cléopâtre", images: ["/videos/posters/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#0a0a0c", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  return (
    <html lang={langFor(locale)} dir={dir} className={arabic.variable}>
      <body className={`min-h-dvh bg-porcelain text-slate${dir === "rtl" ? " font-arabic" : ""}`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-alabaster"
        >
          {locale === "fr" ? "Aller au contenu" : locale === "tn" ? "Rouḥ lel motawa" : "اذهب إلى المحتوى"}
        </a>

        <LocaleProvider locale={locale} copy={COPY[locale]}>
          <LangSync current={locale} />
          <ToasterProvider>
            <CartProvider>
              <SmoothScroll>{children}</SmoothScroll>
            </CartProvider>
          </ToasterProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
