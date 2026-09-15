import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Targo",
  description:
    "Targo builds the testing infrastructure modern teams rely on. From automated pipelines to full-scale QA audits, we make sure your software ships fast and breaks nothing. Hundreds of releases, zero surprises.",
  // Recreation of an external site — keep it out of the shop's index.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f2f1f0",
};

export default function TargoLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
