# Double-Check Audit

Date: 2026-09-19

## Environment rebuilt for verification

Because runtime folders are intentionally excluded from the portable ZIP/snapshots, dependencies and the local database were re-created before this audit:

- `npm ci` — completed; installed 521 packages.
- `npm run db:start` — created local PostgreSQL on port 5433 and wrote `.env`.
- `npm run db:push` — schema applied.
- `npm run db:seed` — seed completed with 81 products and all demo accounts.

## Code checks

- `npm run check` — passed.
  - `npm run typecheck` — passed.
  - `npm run lint` — passed.
  - `npm test` — passed: 111/111 tests.
- `npm run build` — passed.
  - Next.js production build compiled successfully.
  - Static generation completed for 290 app routes.

## Production server checks

Started production server with:

```bash
npm run start -- --hostname 0.0.0.0 --port 3000
```

Then verified:

- `npm run smoke` — passed: 41/41 checks.
- Core public pages — 200 OK.
- Core APIs — 200 OK.
- Anonymous protected routes — correct 307 redirect to login.
- Missing page — correct 404.

## Brand route coverage

All current brand pages returned `200 OK`:

- `/marques`
- `/marque/arkopharma`
- `/marque/avene`
- `/marque/bioderma`
- `/marque/caudalie`
- `/marque/cerave`
- `/marque/ducray`
- `/marque/eucerin`
- `/marque/filorga`
- `/marque/isdin`
- `/marque/klorane`
- `/marque/la-roche-posay`
- `/marque/mustela`
- `/marque/nuxe`
- `/marque/svr`
- `/marque/uriage`
- `/marque/vichy`

## New public route coverage

All returned `200 OK`:

- `/ingredients`
- `/analyse-inci`
- `/dupes`
- `/assistant-produit`
- `/verifier-lot`
- `/courtes-dates`
- `/rappels`
- `/calendrier-reassort`
- `/stock-urgent`
- `/reservation-boutique`
- `/rendez-vous-retrait`
- `/liste-cadeaux`
- `/echantillons`
- `/panier-surveillance`
- `/retours-rma`
- `/communaute-avis`
- `/faq`
- `/newsletter`
- `/consentements`
- `/donnees-personnelles`
- `/editorial`
- `/scanner`
- `/questions-produits`
- `/alertes-produit`
- `/stock-live`
- `/guides-achat`
- `/galerie-clientes`
- `/api/lookup/product?q=CL-0001`

## Protected route coverage

All returned the expected unauthenticated `307` login redirect:

- `/admin/preparation`
- `/admin/packing`
- `/admin/incidents-livraison`
- `/admin/retours-rma`
- `/admin/taches-internes`
- `/admin/moderation-photos`
- `/admin/questions-votes`
- `/admin/landing-pages`
- `/admin/newsletter`
- `/admin/bannieres`
- `/admin/disclaimers`
- `/admin/fournisseurs`
- `/admin/achats`
- `/admin/previsions`
- `/admin/campagnes`
- `/admin/operations`
- `/admin/conformite`
- `/admin/tests`
- `/compte/comparaisons`
- `/compte/marques`
- `/compte/vus-recemment`
- `/compte/etagere`

## Issues found during the double-check

1. Dependencies were absent after workspace restoration because `node_modules/` is intentionally excluded from persisted snapshots and ZIP packaging.
   - Fixed by running `npm ci`.

2. Local `.env` and `.devdb/` were absent because they are intentionally excluded from ZIP/snapshots.
   - Fixed by running `npm run db:start`, `npm run db:push`, and `npm run db:seed`.

3. `/stock-live` logged `RangeError: Invalid time value` when a lot date from an aggregate query was invalid/null-like.
   - Fixed by adding a safe `lotMonth()` formatter that accepts `Date | string | null` and refuses invalid dates.
   - Rebuilt and re-smoked after the fix; server logs no longer show this error.

4. `npm audit --audit-level=moderate` reports a dev-toolchain issue: `drizzle-kit` depends on `@esbuild-kit/esm-loader`, which depends on a vulnerable `esbuild` range.
   - This is in the development migration/tooling chain, not browser/runtime app code.
   - `npm audit fix --force` would downgrade `drizzle-kit` to a breaking older version, so it was not applied.

## Final status

The app builds, tests, typechecks, lints, serves in production mode, and all audited public/protected/brand routes return expected statuses.
