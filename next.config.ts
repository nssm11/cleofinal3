import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Static export for GitHub Pages (and any plain file host).
 * `scripts/build-static.mjs` sets STATIC_EXPORT=1 — the normal build stays a
 * Node server build, because that is what real deployments should run.
 */
const staticExport = process.env.STATIC_EXPORT === "1";

/**
 * GitHub Pages serves this repo under /<repo-name>/. The base path is opt-in
 * so local development and server deployments keep clean root URLs.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Previews (the Arena live panel, tunnels) render the app inside an iframe
 * and are served from production builds — where framing is refused by
 * default. ALLOW_FRAMING=true lifts the refusal there, and only there.
 */
const allowFraming = process.env.ALLOW_FRAMING === "true";
const frameable = !isProduction || allowFraming;

/**
 * Content-Security-Policy — production server builds only.
 *
 * The archive is the product: every film streams from the Internet Archive
 * (archive.org and its ia*.us.archive.org file servers), and the player
 * resolves file lists from archive.org's metadata API in the browser. Those
 * hosts are the only third parties the page may talk to — everything else
 * (fonts, art, scripts) is first-party by design.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src https://archive.org https://*.us.archive.org",
  "connect-src 'self' https://archive.org",
  "frame-src https://archive.org",
  "form-action 'self'",
  ...(frameable ? [] : ["frame-ancestors 'none'"]),
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const framingHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(staticExport
    ? { output: "export" as const, trailingSlash: true }
    : {}),
  /**
   * The development server is reached through hostnames that are not
   * `localhost` — a LAN address on a phone, or the proxied preview host.
   */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "*.e2b.app",
    "*.e2b.dev",
    ...(process.env.NEXT_PUBLIC_DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []),
  ],
  images: {
    // All artwork is locally generated SVG; there is no optimizer story to
    // tell, and static export has no optimizer at all. Keep it honest.
    unoptimized: true,
  },
  ...(staticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                ...baseHeaders,
                ...(isProduction
                  ? [...(frameable ? [] : framingHeaders), { key: "Content-Security-Policy", value: csp }]
                  : []),
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
