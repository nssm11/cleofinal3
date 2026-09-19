import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Two exceptions to `no-img-element`, both deliberate:
 *
 * 1. **Letters** (`src/lib/email/**`) — react-email renders standalone HTML
 *    for mail clients. `next/image` cannot exist there: it needs the Next
 *    runtime, and its optimised, lazily-loaded output would arrive broken (or
 *    not at all) in a mailbox.
 *
 * 2. **The back office** (`src/app/admin/**`, `src/components/admin/**`) —
 *    an operator looks at raw thumbnails, product images that may live on a
 *    supplier's domain, and previews of files that were just uploaded. Those
 *    are not storefront assets to be optimised for LCP; they are the thing
 *    being checked. The route is staff-only and never indexed.
 *
 * Everywhere else the rule stands: the public site serves `next/image`.
 */
export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["src/lib/email/**/*.{ts,tsx}", "src/app/admin/**/*.tsx", "src/components/admin/**/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
]);
