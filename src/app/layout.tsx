import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

// Type is first-party: every face is self-hosted from npm (@fontsource),
// subset by unicode-range — the Arabic subsets arrive only when Arabic does.
import "@fontsource/aref-ruqaa/400.css";
import "@fontsource/aref-ruqaa/700.css";
import "@fontsource/ibm-plex-sans-arabic/300.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/standard-italic.css";
import "@fontsource-variable/jetbrains-mono";

import "./globals.css";
import { site } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://nssm11.github.io/cleofinal3"),
  title: {
    default: `${site.nameAr} — ${site.taglineAr}`,
    template: `%s · ${site.nameAr}`,
  },
  description: site.descriptionAr,
  applicationName: site.nameAr,
  keywords: [
    "أفلام",
    "سينما",
    "أفلام ملكية عامة",
    "أفلام كلاسيكية",
    "مشاهدة مجانية قانونية",
    "أرشيف أفلام",
    "public domain films",
    "open cinema",
  ],
  openGraph: {
    type: "website",
    locale: "ar_AR",
    siteName: site.nameAr,
    title: `${site.nameAr} — ${site.taglineAr}`,
    description: site.descriptionAr,
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0b09",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh bg-night text-bone antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:bg-tungsten focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-night"
        >
          تخطَّ إلى المحتوى
        </a>
        {children}
      </body>
    </html>
  );
}
