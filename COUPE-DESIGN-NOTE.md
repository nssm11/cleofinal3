# LA MAISON EN COUPE — homepage creative direction

**CLÉOPÂTRE, maison de santé & beauté · Tunis**

---

## The concept

The entire homepage is one drawing: an **architectural section** (« coupe ») of the
pharmacy as a house. Not a landing page with products on it — a measured drawing
of a building that happens to sell things. The page scrolls *through* the
building: every register is a planche (plate) in a drawing sheet pinned to a
plaster wall, numbered 00–08, joined by stone courses (horizontal rules with
mortar ticks), lit like a drafting table.

Recognizable without the logo because the *spatial language* is the brand:
horseshoe niches (Kairouan arches) instead of cards, brass drafting ticks,
numbered plates, engraved display type on plaster, a dark vitrine like a
display case sunk into the wall, and an ending in the signatory's block.

## The walk-through

| planche | what it is | what it does |
|---|---|---|
| **00 L'Entrée** | The façade. CLÉOPÂTRE engraved at ~12.4vw on the wall, a facts plate (real counts: références, arcades, maisons tenues, boutiques), one CTA: *Entrer dans la maison*. | Pins and lets the wall lift past the type; no headline/subtitle/button trio — the type *is* the architecture. |
| **01 Le Comptoir** | The pharmacist's choice of the week — 12 real products. | **230vh pinned horizontal sequence**: the strip translates sideways as you scroll, items slide under a fixed intro plate, index counts 01/12 → 12/12. Every specimen stands in a niche; add-to-cart is a brass ticket punched under the price. |
| **02 Les Arcades** | The seven univers — the category system. | Not boxes: an index of the house. Full-width rows with oversized serifs, a cursor-following arch window that previews the arcade's image, and rows linking into `/univers/[slug]`. Mobile gets the same as a swipeable column of numbered doors. |
| **03 La Vitrine** | The shelf of the day / promo universe. | A charcoal display case (`reg-noir`), lit from above; the counter's slate (« L'ardoise du comptoir ») lists real active promos with thresholds. |
| **04 Les Arrivages** | New arrivals, dated from the real `createdAt`. | A dated rail — mobile swipes card-to-card; entries are timestamped like a delivery log, never a "NEW!" badge. |
| **05 L'Ordonnance** | The concerns index (11 real subcategory concerns with real counts). | A ledger: dotted leaders to live counts, tear-off service slips (diagnostic, rituel, conseil, cercle) wired to existing routes. |
| **06 Les Maisons** | 16 real brands. | Two opposing marquees (drafted wordmarks, no logos fetched); each brand links to its real page. |
| **07 Le Journal** | The three latest real articles. | One lead plate with a niche-cropped hero + a numbered rail for the rest. |
| **08 L'Enseigne** | The two real boutiques + practical facts, then the signatory block. | Two doors (Ezzahra / Hammam-Lif) with addresses, hours, tel: links; footer as the drawing's title block. |

## Reinvented header

On `/` only, `HeaderFrame` swaps the chrome: the logo sits on a plaque that
collects into a corner on scroll, a brass **wayfinder rail** (desktop) marks
which planche you're in with live labels (« VOUS ÊTES À LE COMPTOIR »), and
mobile gets a **level dial + full-screen index sheet** listing every plate and
every arcade. Search, cart (live count), wishlist, account, and the three
locales stay wired to the existing providers — the overture's search CTA
dispatches `Event("coupe:search")`, which opens the real search surface.

## Typography, color, motion

- **Newsreader** display (engraved caps for the wall, italics for marginalia)
  against **reg-micro-caps** technical labels at ~8.5px / 0.24–0.3em tracking.
  Scale shifts jump an order of magnitude per register: type is allowed to BE
  the section.
- Color is the existing neutral world — plaster, stone, ivory, charcoal — plus
  one **brass** accent for commerce marks. No green, no gradients, no glass,
  no neon. The one dark register (La Vitrine) is a display case, not a theme.
- Motion is authored, per-sequence: wall-lift on the façade, scroll-driven
  x-translation on the comptoir (pinned), clip-path arch wipes on the arcades
  rows, opposing CSS marquees, sheet dialog on mobile. No uniform fade-ups.
- All interactions gate on **width only** (`min-width: 1024px`), never on
  fine-pointer hover — touch and embedded browsers get the designed state.

## Commerce integrity

Every product, price, strikethrough, stock note (« PLUS QUE 3 EN STOCK »,
« ÉPUISÉ POUR L'INSTANT »), promo code, boutique, brand, article, category and
subcategory is fetched server-side from the existing data layer. Add-to-cart
goes through the real cart provider; links go to real `/produit/*`,
`/univers/*`, `/promotions`, `/journal/*`, `/boutiques` routes. Nothing was
invented; no backend, API, route or admin file was touched.

## Implementation notes

- All new code lives in `src/components/coupe/` (14 files) + a copy block
  `copy.coupe` in the three locale files (`fr`, `tn`, `tn-arab`) + `reg-*`
  utility classes appended to `globals.css` + brass/plaster theme entries.
- `src/app/layout.tsx` now imports `./globals.css` — previously the stylesheet
  was referenced nowhere and production builds shipped unstyled HTML (a
  pre-existing repo bug this work uncovered and fixed).
- Mobile is a separate composition (façade → swipeable comptoir rows →
  numbered arcade doors → dark case → swipe rail → ledger → marquees →
  journal → doors), with the index sheet replacing the wayfinder rail.
