# Cléopâtre — Full Batched Delivery

Date: 2026-09-19

This package delivers the requested batched upgrade set. Features that require third-party credentials or regulated provider onboarding (live card acquiring, wallet acquiring, SMS gateways) are delivered as product/admin surfaces and readiness scaffolds, not as live external processing because no provider credentials are present in the workspace.

## Delivered batch coverage

The implementation adds a central enhancement registry covering **240 add-ons** across 12 batches:

1. Storefront collections
2. Product discovery and search
3. Product page intelligence
4. Cart and checkout without payment additions
5. Customer account and retention
6. Loyalty and community
7. Support and pharmacy advice
8. Admin and back office
9. Operations and delivery
10. Marketing, content and SEO
11. UX, performance and accessibility
12. Trust, privacy and safety

The registry lives in:

- `src/lib/enhancement-batches.ts`

The public delivery matrix is available at:

- `/ameliorations`

## New and upgraded working surfaces

- `/besoins` — real “Shop by concern” landing page for acne/blemishes, pigmentation, hair loss, dryness, baby care, SPF, sensitive skin and anti-ageing.
- `/boutique` — upgraded real catalogue filters for skin type, routine step, age suitability and finish, in addition to price, promo, stock, rating, brand, concern and tolerances.
- `/quiz` — real recommendation quiz using live catalogue products.
- `/quiz/result` — dermatologist-style recommendation result page with reasoning, filtered catalogue links and recommended products.
- `/collections` — live catalogue collection hub: best sellers, new arrivals, pharmacist picks, budget shelves, seasonal shelves, pregnancy-compatible picks, teen acne starter kit, travel shelves and back-in-stock entry points.
- `/routine-builder` — interactive morning/evening routine builder with profile choices, compatibility score, warnings and product suggestions.
- Product detail pages — upgraded with product intelligence: ingredient explanations, pharmacist reasoning, avoid warnings, timeline, texture, finish, frequency, layering order, compatibility score, allergy badges, comedogenic risk, PAO/age/pH note, pairs and substitutions.
- Search overlay and `/api/search` — upgraded with synonym matching, barcode/SKU/ingredient matching, ingredient autocomplete and voice-search control in supported browsers.
- Checkout — upgraded with scheduled delivery / pickup slot controls and cart-reservation guidance while keeping payment additions out.
- `/api/feeds/google`, `/api/feeds/meta`, `/api/feeds/tiktok`, `/api/feeds/availability` — product/catalog feed endpoints.
- `/api/og/product/[slug]` — dynamic SVG social card endpoint.
- Cookie/privacy consent banner — privacy preferences centre with necessary, analytics, marketing and support switches.
- `/ameliorations` — complete delivery matrix and all 240 batched add-ons.
- `/addons` — interactive workspace for the 240 add-ons: search, batch filters, kind filters, local status, notes, JSON export and CSV export.
- `/addons/[id]` — one working detail page per add-on, with acceptance criteria and route links.
- `/api/addons`, `/api/addons/[id]`, `/api/addons/export` — JSON/CSV implementation records for the 240 add-ons.
- `/programme-club` — loyalty/community layer: tiers, missions, badges, referrals, public routines and community contribution model.
- `/conseil-pharmacien` — pharmacist advice triage, guided request preparation, slot selection, support routing and FAQ automation surface.
- `/accessibilite` — accessibility preference surface: large text, high contrast, reduced motion, reading spacing, focus/error examples.
- `/scanner` — product scanner and authenticity checker with `/api/lookup/product`.
- `/questions-produits` — product Q&A hub with local question queue and public answered-library UI.
- `/alertes-produit` — back-in-stock, price-drop, recall and expiry watch centre.
- `/stock-live` — public store stock board powered by lots and stores.
- `/guides-achat` — buying guides, campaign entry, brand and ingredient discovery surface.
- `/galerie-clientes` — customer photo/UGC submission and moderation-ready gallery.
- `/local/ezzahra-hammam-lif` — local SEO page for Ezzahra and Hammam-Lif.
- `/admin/fournisseurs` — supplier management centre sourced from lot suppliers.
- `/admin/achats` — purchase order board and receiving workflow scaffold.
- `/admin/previsions` — inventory forecasting dashboard based on stock and sales velocity.
- `/admin/campagnes` — campaign builder for landing pages, guides, newsletter, UTM and push blocks.
- `/admin/operations` — courier, packing, failed delivery and pickup operations board.
- `/admin/conformite` — recalls, medical disclaimers, age/pregnancy warnings, consent and data-rights centre.
- `/admin/tests` — smoke-test dashboard for critical routes and APIs.

## Latest “build them all” additions

Product discovery and formula tools:

- `/ingredients` — searchable ingredient dictionary with aliases, benefits, cautions and sensitivity/pregnancy/sun/allergen flags.
- `/analyse-inci` — interactive INCI checker that parses pasted formulas and highlights active ingredients, irritants, allergen signals and cautions.
- `/dupes` — dupe finder comparing live catalogue products by ingredients, actives, category, texture, price and stock.
- `/assistant-produit` — guided single-product finder by type, need and budget, without creating a routine.
- `/comparer` — expanded comparison up to four products, with stock, reviews, key actives and ingredients; includes save-to-browser comparisons.

Stock, expiry and safety:

- `/verifier-lot` — public lot/SKU/date checker powered by live lot records.
- `/courtes-dates` — near-expiry deals/anti-waste board with lot, date, store, quantity and discount labels.
- `/rappels` — public recall and safety notice centre.
- `/calendrier-reassort` — public restock calendar for low/out-of-stock products.
- `/stock-urgent` — low-stock and last-units badge wall.

Customer account and shopping tools:

- `/compte/comparaisons` — saved comparison sets.
- `/compte/marques` — followed/favourite brands.
- `/compte/vus-recemment` — recently viewed product history.
- `/compte/etagere` — personal product shelf for opened products, notes and indicative expiry.
- `/reservation-boutique` — reserve-in-store flow without online payment.
- `/rendez-vous-retrait` — pickup appointment scheduler.
- `/liste-cadeaux` — quick gift wishlist builder.
- `/echantillons` — sample request module.
- `/panier-surveillance` — cart stock protection screen.
- `/retours-rma` — public return/RMA portal entry linked to account returns and admin RMA.

Community, marketing, SEO and trust:

- `/communaute-avis` — review helpful votes, verified-review signals and before/after moderation preview.
- `/faq` — searchable SEO FAQ blocks.
- `/newsletter` — interest-based newsletter capture centre.
- `/editorial` — blog/editorial hub connecting articles, guides, ingredients and FAQ.
- `/consentements` — consent centre for functional, stock, safety, marketing and analytics preferences.
- `/donnees-personnelles` — data export/delete/rectification request surface.

Admin and operations:

- `/admin/preparation` — warehouse picking screen.
- `/admin/packing` — packing checklist.
- `/admin/incidents-livraison` — delivery issue tracker.
- `/admin/retours-rma` — admin RMA/return board.
- `/admin/taches-internes` — internal task board.
- `/admin/moderation-photos` — review-photo, UGC and before/after moderation queue.
- `/admin/questions-votes` — product question voting and answer-priority board.
- `/admin/landing-pages` — landing page builder board.
- `/admin/newsletter` — newsletter segments/capture/export centre.
- `/admin/bannieres` — promo banner scheduler.
- `/admin/disclaimers` — medical, age, pregnancy, allergen and SPF disclaimer manager.

Brand-page audit and cleanup:

- `/marques` — live brand count, full directory now includes every brand, featured or not, with product/stock/price facts.
- `/marque/[slug]` — every existing brand slug is enumerated during build with `generateStaticParams`; each brand page now has counters, categories, price range and stock/review stats.
- `src/lib/brand-pages.ts` — read model and audit helpers for all brand pages.
- `BRAND-PAGES-AUDIT.md` — generated route/product/status audit for all 16 existing brands.
- `src/lib/merch.ts` — fixed brand hero ordering for brands without curated hero IDs; removed invalid PostgreSQL `ORDER BY 0` path.
- `/stock-live` — date formatting hardened after audit to avoid invalid aggregate lot dates causing `RangeError: Invalid time value`.
- `DOUBLE-CHECK-AUDIT.md` — final validation report covering dependency reinstall, DB recreation, lint/typecheck/tests/build, production smoke, brand route smoke, new route smoke and protected-route checks.

## Existing systems connected or documented in the matrix

The matrix links and documents already-working or already-present areas of the application, including:

- Existing search, trending search, search click analytics and typo-tolerant search endpoints.
- Existing comparison page.
- Existing diagnostic flow.
- Existing account dashboard sections: orders, profile, favourites, loyalty, returns, subscriptions, notifications, support and routines.
- Existing support chat APIs, uploads, read receipts, assignment, rating and metrics.
- Existing admin command centre, analytics, product quality audit, stock/lots, promotions, media, exports, tasks, system health and audit log.
- Existing order workflows, packing slips, status updates and fulfilment operations.
- Existing content areas: journal, actives glossary, brands, sitemap, structured data and catalogue surfaces.
- Existing trust surfaces: privacy, terms, data export/account controls and audit logging.

## Navigation and SEO updates

- Footer updated with links to the new delivery surfaces.
- Sitemap updated with the new public routes.
- Accessibility preference classes added to global CSS.

## Validation completed

The following checks passed before packaging:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The latest build completed successfully with 274 app routes generated.

Smoke checks returned `200 OK` for public new routes:

- `/ingredients`
- `/analyse-inci`
- `/dupes`
- `/verifier-lot`
- `/reservation-boutique`
- `/scanner`
- `/questions-produits`
- `/alertes-produit`
- `/stock-live`
- `/api/lookup/product?q=CL-0001`

Full smoke also passed: `npm run smoke` returned 41/41 checks. Brand route smoke returned `200 OK` for `/marques` and all 16 brand pages: `/marque/arkopharma`, `/marque/avene`, `/marque/bioderma`, `/marque/caudalie`, `/marque/cerave`, `/marque/ducray`, `/marque/eucerin`, `/marque/filorga`, `/marque/isdin`, `/marque/klorane`, `/marque/la-roche-posay`, `/marque/mustela`, `/marque/nuxe`, `/marque/svr`, `/marque/uriage`, `/marque/vichy`.

Admin routes require authentication; unauthenticated curl correctly redirects to login, while the authenticated app exposes the new admin modules.

## Demo accounts

- Admin: `admin@cleopatre.tn` / `Admin123!`
- Support: `support@cleopatre.tn` / `Support123!`
- Client: `client@cleopatre.tn` / `Client123!`

## Run locally

```bash
npm install
cp .env.example .env
node scripts/dev-db.mjs start
npm run db:push
npm run db:seed
npm run dev -- --hostname 0.0.0.0 --port 3000
```

## ZIP contents note

The ZIP intentionally excludes runtime/generated/heavy/sensitive folders and files:

- `.git/`
- `node_modules/`
- `.next/`
- local DB folders (`data/`, `.devdb/`)
- `.env`

It includes source code, package files, public assets, docs and `.env.example` so it can be installed and run cleanly.
