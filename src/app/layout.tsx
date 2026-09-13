import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToasterProvider } from "@/components/ui/toaster";
import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/lib/i18n/client";
import { LangSync } from "@/components/shell/lang-sync";
import { COPY, getLocale } from "@/lib/i18n/server";
import { dirFor, langFor } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Cléopâtre — Espace Santé Beauté", template: "%s — Cléopâtre" },
  description:
    "Cléopâtre, maison de santé & de beauté à Ezzahra et Hammam-Lif. Dermo-cosmétique, solaire, cheveux et compléments : des produits authentiques, sélectionnés et conseillés par nos pharmaciens, livrés partout en Tunisie.",
  applicationName: "Cléopâtre",
  category: "beauty",
  openGraph: { type: "website", locale: "fr_TN", siteName: "Cléopâtre", images: ["/images/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#f2ecdf", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  return (
    <html lang={langFor(locale)} dir={dir} data-scroll-behavior="smooth">
      <body className={`min-h-dvh bg-paper text-charcoal${dir === "rtl" ? " font-arabic" : ""}`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow-float"
        >
          {locale === "fr" ? "Aller au contenu" : locale === "tn" ? "Rouḥ lel moḥtawa" : "اذهب إلى المحتوى"}
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
