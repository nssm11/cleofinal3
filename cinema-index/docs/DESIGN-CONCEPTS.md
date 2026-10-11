# THE CINEMA INDEX — مرحلة التصور التحريري
## Creative Quality Gate — three compositions, one selection

> قبل أي سطر من الكود، صُممت ثلاث تركيبات تحريرية مختلفة جذريًا، وقورنت،
> ووُحدّد أقواها. هذا المستند هو أثر تلك المرحلة.

Before implementation, three substantially different editorial compositions were
developed and compared. This document records them, the comparison, and the
design rationale for the selected concept. The build follows **Concept 03**.

---

## 01 — «النشرة» / THE BULLETIN
*cinema as dispatch — the broadsheet*

**Structure.** A strict twelve-column newspaper grid with hairline rules running
through everything. The masthead is a nameplate over a dateline row. Content is
set as "dispatches": a cover story in the lead columns, reviews as stacked
text-only slugs, the catalog as a dense table (number · title · year ·
director · verdict). Images are subordinate — column-width photos with flush
captions, never bleeding. The accent color appears only in folio numbers and
correction marks, like printer's ink on newsprint.

**Palette.** Newsprint off-white `#EDE7DA`, ink `#1A1712`, hairline `#B7AC99`,
vermilion folio marks.

**Type.** Condensed Arabic display for headlines (tight leading, justified
multi-column), mono for all metadata. Density is high; whitespace is ruled,
not open.

**Strengths.** Speed, information density, unmistakable editorial authority.
Browsing a large catalog feels native to the metaphor.

**Weaknesses.** Cinematic imagery — the emotional core of a film platform — is
kept on a leash. The first viewport communicates "publication" before "cinema".
Risk: a cultural-newspaper website that happens to link videos. On mobile the
grid collapses into stacked columns and loses its identity.

---

## 02 — «الشريط» / THE STRIP
*cinema as material — the contact sheet*

**Structure.** The page is a film strip: horizontal bands with sprocket
perforations along the edges, frame numbers on every image, chapter titles in
the "frame line" between rows. Scrolling is rolling through a reel. Films are
frames; collections are strips; the catalog is a wall-sized contact sheet with
grease-pencil circles on selected frames (the accent is the grease pencil
vermilion). Text sits inside frames as burned-in metadata.

**Palette.** Silver-gelatin greys `#101010 → #E6E3DD`, duotone images,
one vermilion mark.

**Type.** Mono-dominant (frame numbers, timecodes), Arabic display used only as
"burned-in" title cards. Everything reads as apparatus.

**Strengths.** A memorable, physical metaphor that no streaming template owns.
Image-forward and proudly material.

**Weaknesses.** The metaphor taxes usability: horizontal language fights RTL
reading, text hierarchy suffers inside frames, and metadata gets sacrificed to
"film look". Long synopses, filters, and watchlists don't live on a film strip.
Risk: a collection of disconnected design experiments rather than a product.

---

## 03 — «الفهرس» / THE INDEX — *الملف الشخصي: كتالوج سينمائي مستقل*
*cinema as indexed culture — the periodical with a cover story*

**Structure.** A warm-paper periodical in which every section is a *spread* with
its own composition logic, bound by one typographic system and one indexing
language:

1. **Masthead** — «الفِهرِس» oversized in Reem Kufi, with a mono strapline
   (`THE CINEMA INDEX — ARCHIVE EDITION`), issue folio (`العدد 01`), and a thin
   navigation rail. It stays sticky as a two-line band, not a floating pill.
2. **Cover story** — the featured film as a magazine cover: a wide cinematic
   still bleeding off the page edge, an oversized Arabic headline overlapping
   the image boundary (asymmetric line breaks chosen by hand), a mono metadata
   rail (index code · year · director · runtime · origin), a synopsis excerpt,
   and two honest actions (watch / open the feature).
3. **Curated collection essay** — an introduction in two columns with a
   pull-quote, then three films listed typographically with small stills and
   cross-references. Collections carry real editorial identifiers (المجموعة 01…).
4. **Contact sheet** — a horizontal strip of stills with frame numbers
   (`ف-021`), captions below, snap-scrolling on mobile. Images link to features.
5. **The index itself** — the catalog as a compact typographic table (festival
   program, not product cards): index number · Arabic + original titles · year ·
   director · genre words · runtime · actions. Dense but scannable; filters are
   text links with an accent underline.
6. **Serial column** — the *Les Vampires* episode index as a numbered ledger
   with progress ticks.
7. **Colophon footer** — print-style: editorial statement, rights and sources
   (Internet Archive, public-domain delivery), index of links, issue sign-off.

**Palette.** Warm paper `#F2EDE4`, deep paper `#E8E0D1`, ink `#16130F`,
soft ink `#4A443B`, rule `#C9BFAE`, **vermilion accent `#C23A1B`** (chosen
from three directions — see below). Flat fills and fine rules only. No
gradients as treatment, no glass, no shadow stacks, no rounded-card sea.

**Type.**
- Arabic display: **Reem Kufi** — oversized, geometric, unmistakably Arabic;
  used for masthead, cover headlines, section openings.
- Arabic text: **IBM Plex Sans Arabic** — synopsis, UI, body; wide weight range.
- Latin/metadata: **IBM Plex Mono** — index codes, years, runtimes, labels,
  tracked uppercase micro-type.
The hierarchy is built on scale and line breaks, not on decoration. Arabic is
the design language; Latin mono is the apparatus around it.

**Strengths.** Holds editorial precision and cinematic imagery in tension
without letting either win. Section density is intentionally varied (expansive
cover → dense index), so whitespace is compositional. The indexing language
(film numbers, collection IDs, year groups, cross-references) serves real
discovery. Scales honestly to mobile with a *different* composition (see
below), and every experimental move has a legible function.

**Weaknesses.** Demands disciplined typesetting (hand-tuned line breaks,
consistent rails). Controlled by a strict token system and reusable primitives.

---

## Selection

**Selected: Concept 03 — «الفهرس» / THE INDEX.**

Rationale in one line: *Concept 01 has authority but not cinema; Concept 02 has
cinema but not a product; Concept 03 makes the catalog itself the
spectacle — a curated cinema publication that streams, rather than a streaming
skin wearing magazine clothes.*

What survives from the rejected concepts (deliberately, not decoratively):

| Borrowed | From | Where it lands |
| --- | --- | --- |
| Index-table rigor, folio numbering | 01 THE BULLETIN | The Index rows, colophon, issue folio |
| Frame numbering, contact-sheet rhythm | 02 THE STRIP | Contact sheet section, still captions, `ف-` codes |
| Nothing else | | Unifying tension: editorial precision × cinematic imagery |

### Accent color decision
Three directions were tested against the complete concept on paper:

- **Vermilion `#C23A1B`** — reads as risograph ink and festival-catalog red on
  warm paper; marks selections, live states, and the watch action. Chosen.
- Cobalt — too institutional next to warm paper; cools the photographic tones.
- Acidic yellow-green — survives on screen, dies on paper metaphor; too "tech".

### Responsive art direction (not stacked desktop)
- **Desktop** — 12-column asymmetric spreads; cover image bleeds one edge;
  index as true table rows with a metadata rail.
- **Mobile** — a different composition: masthead compresses to a two-band
  folio + full-height typographic menu sheet; the cover story stacks with the
  headline overlapping the lower image edge; the contact sheet becomes a
  snap-scroll strip; the index table becomes stacked "index slips" (code on
  top, wrapped metadata, action row) rather than a squeezed table. Type scale
  is recalibrated (clamp), image crops re-authored (`aspect-ratio` + `object-position`).

### Motion principle
Editorial, not theatrical: typographic hover states (accent underline grows
from the inline start), image reveals as quick clipped wipes on first paint of
a spread, smooth filtering with a short stagger only on the changed list,
search overlay as a paper sheet sliding over the page. All of it guarded by
`prefers-reduced-motion`. No perpetual motion, no scroll-jacking, no parallax.

### Honest content policy
The catalog is **real public-domain cinema** (verified Internet Archive items,
factual metadata: directors, years, runtimes, casts). Artwork is **original
editorial interpretation** generated for this publication — clearly labeled in
the UI and in `src/data/` as such, never presented as an official still or
poster. Playback is delivered through the authorized provider (Internet
Archive embed of public-domain items) — no pretense of unlimited commercial
licensing. Demonstration-only surfaces (local watchlist/history) are isolated
in `src/lib/library/` behind a swap-ready interface for a future secure backend.
