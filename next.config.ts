import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy — production only.
 *
 * The development server relies on `eval` for hot reloading, and a policy that
 * breaks HMR teaches people to disable it. Next injects its bootstrap inline,
 * hence `'unsafe-inline'` on scripts; styles come from Tailwind and from a few
 * inline `style` attributes (motion transforms).
 *
 * `frame-ancestors 'none'` is the production statement that this shop must not
 * be framed — the modern equivalent of X-Frame-Options.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/** Headers that never get in the way — safe in every environment. */
const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * Headers that refuse to let anything load the site in a frame.
 *
 * These are deliberately production-only. In production, being un-framable is
 * the point: it is what stops a clone of the shop from being wrapped inside
 * someone else's page. In development it is actively harmful — the live preview
 * renders the app inside an iframe, so `X-Frame-Options: DENY` leaves the
 * developer staring at an empty panel. The containment belongs where the
 * threat is, not on the workbench.
 */
const framingHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const securityHeaders = [
  ...baseHeaders,
  ...(isProduction ? [...framingHeaders, { key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * The React Email renderer is left external on purpose. Compiled into the
   * server-component layer, its `react-dom/server` import resolves to the
   * `react-server` condition, where that module throws by design. As an
   * external package it is required at runtime under plain Node conditions
   * and renders fine — which is exactly what the transactional e-mail system
   * needs, since every letter is rendered server-side.
   */
  serverExternalPackages: ["@react-email/render", "@react-email/components"],
  /**
   * The development server is reached through hostnames that are not
   * `localhost` — a LAN address on a phone, or the proxied preview host. Next
   * blocks cross-origin requests to its dev internals by default, which shows
   * up as missing scripts and styles rather than as an error. Only the hosts
   * below are accepted, and only while developing.
   */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    // Hosted previews and tunnels present the dev server under their own
    // domain. Listing them keeps Next from refusing its own scripts and styles
    // there — a failure that looks like a blank page rather than an error.
    "*.e2b.app",
    "*.e2b.dev",
    ...(process.env.NEXT_PUBLIC_DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []),
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
