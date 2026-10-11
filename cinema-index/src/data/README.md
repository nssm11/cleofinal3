# Data layer — content provenance

Everything a visitor reads or watches in THE CINEMA INDEX passes through this
folder. Three kinds of material live here, and they are kept strictly apart:

1. **Film facts** (`films.ts`, `series.ts`) — titles, years, directors, cast,
   runtimes, synopses. Factual data about real works, written here in Arabic
   for the publication. No invented rankings, ratings, or metadata.

2. **Authorized media references** (`media` on each work) — every `itemId` is a
   **verified** archive.org identifier (checked against the Internet Archive
   search API during production). Playback happens only through the provider's
   own embed of these public-domain items. `rights` records the basis;
   `rightsNoteAr` states it in the UI. The prototype never pretends to deliver
   unlimited commercial video.

3. **Editorial artwork** (`/public/art`) — original images produced for this
   publication. They are **interpretations**, not frames from the films, and
   every surface labels them (`kind: "editorial-interpretation"`). Five plates
   (`still-lens`, `still-marquee`, `still-candle`, `still-newsroom`,
   `still-zinc-roofs`) are **editorial treatments derived from the
   publication's own commissioned imagery** (see `scripts/derive-art.mjs`):
   distinct crops and tonal treatments, still original material — no external
   or third-party artwork is used anywhere.

Demonstration-only state (watchlist, history, playback progress) does **not**
live here — it is isolated in `src/lib/library/` behind a small interface
(`LibraryApi`) with a localStorage adapter, so a future secure backend can
replace the adapter without touching the views.

## Index numbering

Index codes (`ف-001`) are this publication's own shelf marks: stable IDs for
cross-reference and citation inside the index. They are not rankings.
