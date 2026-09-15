import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/** The hero video is the first paint of the page — start it in the head,
    before the parser reaches the <video> element. */
const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_050407_500d0339-ab28-41c1-9688-132a74a3b5aa.mp4";

/**
 * This is a recreation of an external site hosted inside the shop — keep it
 * out of search engines. Flip to `true` the day /targo becomes the real
 * Targo page (and make sure the title/description are final).
 */
const TARGO_INDEXABLE = false;

export const metadata: Metadata = {
  title: "Targo",
  description:
    "Targo builds the testing infrastructure modern teams rely on. From automated pipelines to full-scale QA audits, we make sure your software ships fast and breaks nothing. Hundreds of releases, zero surprises.",
  robots: TARGO_INDEXABLE ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f2f1f0",
};

export default function TargoLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <link rel="preload" as="video" href={HERO_VIDEO_URL} />
      {children}
    </>
  );
}
