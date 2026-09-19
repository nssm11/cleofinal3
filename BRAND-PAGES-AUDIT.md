# Brand Pages Audit

Date: 2026-09-19

## Coverage

Every brand currently in the database has a working public page at `/marque/[slug]`. Total brands: **16**.

| Brand | Route | Products | In stock | Story | Status |
| --- | --- | ---: | ---: | --- | --- |
| Avène | `/marque/avene` | 8 | 8 | yes | ready |
| Bioderma | `/marque/bioderma` | 8 | 8 | yes | ready |
| Caudalie | `/marque/caudalie` | 4 | 3 | yes | ready |
| Filorga | `/marque/filorga` | 3 | 2 | yes | ready |
| La Roche-Posay | `/marque/la-roche-posay` | 15 | 13 | yes | ready |
| Nuxe | `/marque/nuxe` | 5 | 5 | yes | ready |
| Vichy | `/marque/vichy` | 7 | 7 | yes | ready |
| Arkopharma | `/marque/arkopharma` | 7 | 7 | yes | ready |
| CeraVe | `/marque/cerave` | 2 | 2 | yes | ready |
| Ducray | `/marque/ducray` | 4 | 4 | yes | ready |
| Eucerin | `/marque/eucerin` | 3 | 3 | yes | ready |
| ISDIN | `/marque/isdin` | 2 | 2 | yes | ready |
| Klorane | `/marque/klorane` | 3 | 2 | yes | ready |
| Mustela | `/marque/mustela` | 5 | 4 | yes | ready |
| SVR | `/marque/svr` | 2 | 2 | yes | ready |
| Uriage | `/marque/uriage` | 3 | 2 | yes | ready |

## Code audit and fixes

- Added `src/lib/brand-pages.ts` as the brand-page read model for slugs, directory rows, stats and route audit rows.
- Added `generateStaticParams` to `/marque/[slug]` so every existing brand slug is enumerated during build.
- Upgraded `/marques` from a hard-coded count to live database counts, and made the full directory include every brand, featured or not.
- Upgraded each brand page with factual counters, category links, price range and stock/review stats.
- Fixed `getBrandHeroProducts` so brands without curated hero IDs order by sales count instead of emitting invalid PostgreSQL `ORDER BY 0`.

## Validation run

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm test` — passed: 111/111 tests
- `npm run build` — passed: 290 app routes generated
- `npm run smoke` — passed: 41/41 checks
- Brand route smoke — passed for `/marques` and all 16 brand routes.
