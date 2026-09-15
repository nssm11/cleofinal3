# Targo — standalone export

Framework-free, single-file recreation of the Targo hero + about page.
Same markup, CSS and behaviour as `src/app/targo` in the Next.js app, but
zero build step: quantico is pulled from Google Fonts, everything else is
inline.

Deploy it to any static host (Netlify, Cloudflare Pages, S3, GitHub Pages,
plain nginx) by uploading `index.html`.

Notes:

- Videos stream from the original CloudFront URLs — the host must allow
  playback from your domain (they allow all referrers by default).
- If you deploy behind a strict CSP, allow:
  `media-src https://d8j0ntlcm91z4.cloudfront.net`,
  `font-src https://fonts.googleapis.com data:`,
  `style-src https://fonts.googleapis.com 'unsafe-inline'`,
  `script-src 'unsafe-inline'` (or move the script to an external file).
