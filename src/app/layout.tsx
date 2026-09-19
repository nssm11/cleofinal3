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
 * THE THREE VOICES OF THE HOUSE.
 *
 * Anton carries statements — a poster face, condensed and absolute, used only
 * where a sentence has to be seen from across a room. Instrument Sans speaks
 * everything else: navigation, product names, long copy. JetBrains Mono holds
 * the data: prices, references, stock, indices, every micro-cap label that
 * turns an interface into an instrument.
 *
 * All three are self-hosted and subset through next/font/local, so the first
 * paint never waits on a third-party origin, and the layout never shifts.
 */
const ant = localFont({
  src: [
    { path: "../../node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/anton/files/anton-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-ant-face",
  display: "swap",
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
  adjustFontFallback: false,
});

const sans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-sans-face",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const mono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2",
      weight: "400 600",
      style: "normal",
    },
  ],
  variable: "--font-mono-face",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
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
  title: { default: "Cléopâtre — Officine dermo-cosmétique", template: "%s — Cléopâtre" },
  description:
    "Cléopâtre, officine dermo-cosmétique à Ezzahra et Hammam-Lif. Peau, cheveu, corps, soleil, bébé : des produits authentiques, sélectionnés et conseillés par nos pharmaciens, livrés partout en Tunisie.",
  applicationName: "Cléopâtre",
  category: "beauty",
  openGraph: { type: "website", locale: "fr_TN", siteName: "Cléopâtre", images: ["/videos/posters/hero.jpg"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#f5f5f7", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirFor(locale);
  return (
    <html
      lang={langFor(locale)}
      dir={dir}
      className={`${ant.variable} ${sans.variable} ${mono.variable} ${arabic.variable}`}
    >
      <body className={`min-h-dvh bg-canvas text-carbon${dir === "rtl" ? " font-arabic" : ""}`}>
        {/* LES RÉGLAGES DE LA MAISON, before the first paint.
            Runs synchronously so nobody who asked for the night is shown
            daylight for half a second. Two of the three defaults come from
            the visitor: the OS reduced-motion preference, and the browser's
            own save-data flag. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,g=function(k){try{return localStorage.getItem('cleo.'+k)}catch(e){return null}};
var sd=(navigator.connection&&navigator.connection.saveData)||false;
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
d.dataset.night=g('night')==='1'?'1':'0';
d.dataset.save=(g('save')==='1'||sd)?'1':'0';
d.dataset.motion=(g('motion')==='0'||(g('motion')===null&&rm))?'0':'1';
}catch(e){}})()`,
          }}
        />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:bg-carbon focus:px-4 focus:py-2 focus:kicker focus:text-canvas"
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
