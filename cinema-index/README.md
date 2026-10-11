# الفِهرِس — THE CINEMA INDEX

**An Arabic cinema publication that streams.** Not a streaming template dressed
up as a magazine — an independently art-directed cultural periodical (warm
paper, ink, one vermilion accent, oversized Reem Kufi) that happens to offer
playback of public-domain cinema through authorized sources.

- **Concept & rationale** → [`docs/DESIGN-CONCEPTS.md`](docs/DESIGN-CONCEPTS.md)
  (three substantially different editorial compositions were designed and
  compared before a line of code; the build follows the selected concept).
- **Content provenance** → [`src/data/README.md`](src/data/README.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (binds 0.0.0.0 for previews)
npm run build      # type-check + production build
```

Node 20+ · Vite · React 19 · TypeScript · React Router · CSS Modules — all
free and open source. No paid service is required anywhere in the prototype.

## What is real (and what is not)

| Surface | Status |
| --- | --- |
| Catalog (24 works: 11 films + 2 serials × 13 episodes) | **Real** open/public-domain cinema with factual metadata. Every source is a verified Wikimedia Commons file (provider API videoinfo: size, duration, transcode ladder) recorded in `src/data/sources.ts`. No work is published without a verified source. |
| Playback | **Authorized**: Wikimedia Commons file streaming + downloads (public-domain / CC — permitted). Real quality ladder from the provider, honest verification panel (live probe + cache + periodic recheck), real error states. The Internet Archive is not used anywhere. |
| Artwork (`/public/art`) | **Original editorial interpretation** produced for this publication — labeled as such on every surface (`ArtNote`). Five plates are derived treatments of the publication's own commissioned imagery (`scripts/derive-art.mjs`). No third-party artwork anywhere. |
| Watchlist · history · progress | **Demonstration-only**, local to the browser, isolated behind `LibraryApi` (`src/lib/library/`) so a future secure backend can swap the adapter without touching views. |

Index codes (`ف-001`) are this publication's shelf marks for cross-reference —
never rankings or invented ratings.

## Identity

- **Palette** — warm paper `#F2EDE4`, deep paper `#E8E0D1`, ink `#16130F`,
  rule `#C9BFAE`, **vermilion accent `#C23A1B`** (chosen over cobalt and acid
  yellow-green; see the design concepts doc). Flat fills and fine rules only —
  no gradient treatments, no glass, no shadow stacks, no rounded-card sea.
- **Type** — **Reem Kufi** (Arabic display: masthead, cover headlines),
  **IBM Plex Sans Arabic** (text), **IBM Plex Mono** (apparatus: index codes,
  years, runtimes, Latin micro-type). Arabic is the design language; Latin mono
  is the apparatus around it. Letter-spacing is never applied to Arabic
  (it breaks cursive joins).
- **RTL** — `dir="rtl"` at the root, logical properties throughout, hand-set
  line breaks for oversized Arabic headlines, isolated LTR runs for numeric
  metadata (`u-ltr`).

## Composition (homepage = a curated issue)

1. **Masthead** — folio rail (`العدد 01` · strapline · season) + display
   wordmark «الفِهرِس» + typographic nav (query-aware active states).
2. **Cover story** — featured film as magazine cover: three-line display
   headline, metadata rail, dek, watch/feature actions, still bleeding off the
   page edge. On mobile the image comes first and the paper block cuts into it.
3. **«في هذا العدد» ticker** — the issue's contents, straight to the catalog.
4. **Collection essay** (المجموعة 01) — intro columns, oversized pull-quote,
   ordered stills with shelf marks.
5. **Contact sheet** — numbered frames (`ف-021`…), snap-scroll on mobile.
6. **The Index** — the catalog as a festival-program table (code · AR/original
   titles · year · director · genres · runtime · actions). Mobile gets stacked
   "index slips", not a squeezed table.
7. **Serial column** — *Les Vampires* episode ledger with progress ticks.
8. **Colophon** — print-style statement, sources and rights, link index.

Interior pages: `/catalog` (index ↔ collections, era/genre filters via URL),
`/film/:slug` (editorial feature: lead, «من الفهرس» note, cast, watch panel,
cross-references), `/series/:slug` (episode index + progress), `/watch/...`
(player with honest source states), `/watchlist`, `/history`, 404. Search is a
paper overlay (`⌘/Ctrl+K`) with live results, arrow-key navigation, and
recents.

## Architecture

```
src/
  data/            catalog content (films, series, collections) + provenance notes
  lib/
    format.ts      typographic apparatus (runtime, dates, issue folio)
    library/       LibraryApi + localStorage adapter + hooks (swap point for backend)
  components/
    primitives/    SectionHead, MetaRail, GenreWords, ArtNote, ProgressTick, ActionLink
    layout/        Masthead, Colophon, SearchOverlay (+ SearchContext)
    film/          WorkIndex (rows/table), ContactSheet, CrossRefs
  routes/          HomePage, CatalogPage, FilmPage, SeriesPage, WatchPage,
                   WatchlistPage, HistoryPage, NotFoundPage
  styles/          tokens.css (one source of truth) + base.css
scripts/           screenshot.mjs (QA captures), derive-art.mjs (art treatments)
```

Design tokens (color, type scale, space, layout, motion) live only in
`src/styles/tokens.css`. Motion is restrained by policy — hover rules, one
route fade, the search sheet — all disabled under `prefers-reduced-motion`.
Every control performs its advertised function; focus states are visible.

## QA record (this session)

Ran the app and inspected desktop (1440×900) and mobile (390×844) captures of
every route plus search/menu states with a headless-chromium pipeline
(`scripts/screenshot.mjs`). Rejected and fixed after inspection: joined
headline words on mobile, letter-spaced Arabic labels, mobile heroes stacking
in the wrong order, doubled nav active states, year search returning nothing,
missing series artwork, duplicate original/latin title lines, and an honest
fallback for the player when the provider is unreachable. Captures are written
to `qa/shots/` locally (not committed).

## Roadmap seam

`LibraryApi` is the seam for a future secure backend (accounts, server-side
history, licensed catalogs); `media.provider` is the seam for additional
authorized sources; the Android client can consume the same routes and data
model (RTL-first layouts already calibrated for ordinary phones).
