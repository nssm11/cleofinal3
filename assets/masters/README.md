# Les masters — the source films

The reels the site serves live in `public/videos/` and **are** in Git. The
masters they are cut from are **not** — 45 MB of 1920×1080 source, useless to
anyone who is not re-cutting a chapter.

```
assets/masters/        ← you are here · git-ignored · never committed
public/videos/         ← the deliverables · committed
scripts/video-chapters.mjs   ← the only bridge between the two
```

## Rebuilding a chapter

```bash
node scripts/video-chapters.mjs            # build what is missing
node scripts/video-chapters.mjs --force    # rebuild everything
node scripts/video-chapters.mjs --dry-run  # show the plan, touch nothing
node scripts/video-chapters.mjs --check    # inventory of what is served
```

or `npm run video:chapters` / `npm run video:check`.

`ffmpeg` comes from the `@ffmpeg-installer/ffmpeg` devDependency, so no system
install is needed; a system `ffmpeg` is used if the package is absent.

## The convention

| Output | Spec |
|---|---|
| `category-<chapter>.mp4` | 1920×1080 · h264 High · 24 fps · **no audio** · `+faststart` |
| `category-<chapter>-mobile.mp4` | 1080×1920 · the centre 608×1080 of the master, scaled up |
| `posters/<chapter>.jpg` | 1920×1080 still, taken 25 % into the reel |

Audio is dropped everywhere: every reel plays muted, looped and inline.

The mobile export is **not** a second take. It is the centre crop of the same
master — verified against the files that already shipped (42 dB PSNR between
`category-baby-mobile.mp4` and the centre crop of its master). One master, two
exports, so a handset never shows a moment the desktop does not.

## Inventory

| Master | Chapter | Universe |
|---|---|---|
| `visage.mp4` | `category-skin` | Visage |
| `cheveux.mp4` | `category-hair` | Cheveux |
| `corps.mp4` | `category-body` | Corps |
| `bebe-et-maman.mp4` | `category-baby` | Bébé & Maman |
| `hygiene-intime.mp4` | `category-hygiene` | Hygiène & Bien-être |
| `bien-etre.mp4` | `category-complements` | Compléments |
| `hero.mp4` | `hero-main` | opening reel of the homepage |
| `login.mp4` | `auth-login` | the door (`/connexion`) |
| `sante.mp4` | — | **reserved** — no chapter needs it yet |

Two holes the script reports rather than hides:

- **`category-sun` has no master.** The deliverable is served and committed,
  but `solaire.mp4` was never delivered, so that chapter cannot be re-cut.
- **`sante.mp4` has no chapter.** Two universes were still falling back to the
  house film (Hygiène and Compléments); both now have their own reel. `sante.mp4`
  is kept for the next chapter rather than deleted.

## If you need the 85 MB back

The masters are in the repository's **history** even though they are no longer
tracked. Removing them rewrites every commit that follows — every clone must be
re-cloned, and any open branch must be rebased. It is deliberately not done by
default. When you are ready, on a clean tree with everything pushed:

```bash
git clone --mirror <remote> cleopatre.git      # work on a mirror, never the original
cd cleopatre.git
git filter-repo --path-glob '*.mp4' --invert-paths --path assets/masters/ --invert-paths
git gc --aggressive --prune=now
```

then re-add the masters locally, check the site still serves every reel with
`npm run video:check`, and force-push.

Without `git filter-repo`: `pipx install git-filter-repo` (or the `BFG`).
