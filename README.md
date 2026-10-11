# خيال · KHAYAL — دار الأفلام المفتوحة

**An Arabic-first open film archive.** Public-domain classics and openly
licensed (CC BY) cinema, curated, catalogued, and legally streamable — with a
brand identity built around the projection room, not around a template.

The site is Arabic (RTL) end to end; the film record, search, programming
notes, player UI — all of it is conceived right-to-left, not mirrored into it.
URLs stay Latin (`/films`, `/watch/…`) — the convention of every Arabic
streaming product.

---

## The identity — «غرفة الإسقاط» (The Projection Room)

A cinematheque at night, printed like a program booklet:

| Token | Value | Role |
|---|---|---|
| `night` / `coal` / `soot` | `#0e0b09 → #17120d → #201912` | the room — warm lamp-black, never pure black |
| `bone` / `ash` / `faint` | `#ece3d0 / #a2937c / #6f6353` | text on dark |
| `paper` / `ink` | `#f1ead9 / #1c1610` | the printed program (about, the coming-soon panel) |
| `tungsten` | `#e8a33d` | the lamp — the only "brand color": play, focus, resume |
| `cinnabar` | `#c65233` | the signal — one drop per view: save state, 404, live dot |
| `tint-*` | amber/blue/green/red/sepia/violet | **the signature device** |

**Tints are not decoration.** They follow the historical hand-tinting of
silent film (amber day, blue night, green uncanny, red fire, violet dream);
each title carries one, and it drives its plate, its shelf mood, and the
series' wide art. Motion is the same discipline: a projector, not a
trampoline — one shared easing set (`--ease-projector`, `--ease-shutter`,
`--duration-flip/slide/scene/reel`), entrances only on real context changes,
every honor to `prefers-reduced-motion`.

### Typography (all self-hosted from npm, subset by unicode-range)

- **Aref Ruqaa** — Arabic display (ruqʿah naskh-script calligraphy). Titles,
  hero, plate lettering. Never letter-spaced; line-height 1.28+.
- **IBM Plex Sans Arabic** — UI voice for both scripts; the Latin/Arabic mix
  in meta rows renders in one consistent humanist sans.
- **Fraunces Variable** — Latin companion serif (program notes, italic
  original titles), optical-size axis on.
- **JetBrains Mono Variable** — archive codes, years, clocks (tabular). Latin
  contexts only; Arabic digits-in-mono fall back to Plex *by design*.

Mixed-script rules encoded in CSS: `.label-mono` (Latin/numerals, tracked
0.14em) vs `.label-ar` (Arabic, **zero tracking**) — tracking Arabic breaks
its joining, so the system refuses it structurally.

### Title art — the honest poster engine

We can't license original posters and will not fake them. Instead
`src/features/posters/` generates a deterministic **art plate per title**
(pure SVG, seeded by the slug): a tint field, a motif drawn from the film's
own era (eclipse, shattered light, blinds, arcs, peaks, orbit, grid, film
strip), a mounted-plate frame with registration ticks, the house seal (خ),
print speckles, and type fitted by bucketed size with balanced two-line
Arabic wrapping. Every plate states its title, year, runtime and license;
none pretends to be studio artwork. Inspect offline with
`node --import tsx scripts/art-preview.mjs`.

---

## Content — real, legal, verified

36 films + 3 series (30 episodes) are catalogued in `src/data/`, every one
against its **Internet Archive** item (public-domain features or Blender
Foundation CC BY open movies). Playback resolves *live* per item through the
Archive metadata API (`src/features/player/resolve.ts`): best MP4 derivative
→ the player; failure → the Archive's embed (labeled); final fallback → the
source page. The Arabic catalog copy (synopses, program notes) is written for
this archive, and the **Arabic-cinema shelf is a printed promise, not fake
content**: `/about#arabic` states the licensing/restoration plan because not
one Arabic classic could be shown lawfully on $0 today — and we won't fill the
gap with piracy or stock photos.

License truth is enforced by *laws* (`src/data/laws.test.ts`): every title has
a license, CC-BY implies attribution, slugs are unique, nothing streams on
faith.

## Product surface

- **Home** — tonight's program (deterministic daily rotation), then shelves
  that each compose differently: rail (Keaton) · salon hang (Expressionism) ·
  index ledger (Noir) · wide plates (Open Workshop) · contact sheet wall
  (Chills) · feature block (Beginnings) · computed stats strip · the paper
  "under restoration" notice. No two shelves are interchangeable.
- **Films catalog** — URL-state filters (genre/decade/sort), shareable, empty
  states designed.
- **Search** — client-instant over a normalized Arabic index (alef/hamza/taa
  folding), title > people > body ranking, episodes and collections found
  directly, keyboard-driven, recent queries stored locally.
- **Film / series detail** — plate as object, program-note typography,
  rights table, collection membership, shelf of relations. Series pages print
  seasons/episodes with numbers *only where documented*.
- **Player** (`(watch)` group, no chrome): custom controls (drag-seek with
  buffered ranges, volume, speed, quality switch without losing position,
  subtitles when the item ships them, PiP, fullscreen), honest resume
  (toast + rewind-to-start), save progress per device, RTL-logic arrows,
  graceful embed mode.
- **قائمتي** — device-local watchlist (films + single episodes), hydration-safe
  store, remove everywhere, honest empty state.

## Engineering

Next 16 App Router · React 19 · **TypeScript strict** · Tailwind v4 (tokens in
one `@theme`) · Radix primitives · Embla (rail) · Framer-motion-free by choice
— the choreography is CSS + IntersectionObserver, fewer bytes, fewer ghosts.
Zod-validated data layer: pages read through `src/features/content/repository`
(one binding point for a future DB/CMS swap). Route-level SSG for everything
(dynamicParams off → real 404s), CSP with media-src limited to archive.org,
`X-Frame-Options` only where the threat is (production), zero client
analytics, zero cookies.

```
src/
  app/(archive)/…   # the site: home, films, series, collections, search, list, about
  app/(watch)/…     # the projection room: /watch/films/[slug], /watch/series/[slug]/[ep]
  components/       # ui primitives, shell, catalog shelves
  features/         # content, catalog, watchlist, player, posters, search — logic+state per domain
  data/             # the archive record (zod-enforced) + laws tests
  lib/              # format, cn, tiny store
```

**Tests** (`npm test`): search normalization & ranking, catalog integrity,
daily-program determinism, source picking/fallback, clock/hash math.
**Gates** (`npm run check`): tsc strict + eslint (core-web-vitals, incl.
React-19 effects rules) + tests. `npm run smoke` hits the built server over
every surface.

## Zero-budget run & deploy

```bash
npm ci && npm run dev            # develop
npm run build && npm start       # any Node host (free tier fine)
npm run build:pages              # fully static out/ → GitHub Pages (any repo name)
```

The static export (same content minus server headers) deploys via
`.github/workflows/deploy-pages.yml` — $0/host. Everything degrades honestly
offline (local fonts & art are self-hosted; only playback needs the network).

**Known, stated limits:** the daily rotation is computed at build time for the
static export (server mode rotates live); the Archive's CDN occasionally
serves slow first bytes (the player waits visibly, then embeds); Arabic
subtitles on the PD library are sparse — the player uses whatever the item
ships, and says so.

*Every film here is public domain or CC BY at cataloguing time; attribution
links sit beside every play button. If a right is ever re-claimed upstream,
the title is removed and the ledger says why — see `/about` policies.*
