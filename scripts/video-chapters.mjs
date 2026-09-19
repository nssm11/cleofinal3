#!/usr/bin/env node
/**
 * VIDEO CHAPTERS — turn the house's source masters into the deliverables the
 * site actually serves.
 *
 *   node scripts/video-chapters.mjs              build what is missing
 *   node scripts/video-chapters.mjs --force      rebuild everything
 *   node scripts/video-chapters.mjs --dry-run    show the plan, change nothing
 *   node scripts/video-chapters.mjs --check      verify the served assets only
 *
 * Every chapter obeys one convention, already honoured by the files that ship
 * in `public/videos/`:
 *
 *   category-<chapter>.mp4          1920×1080 · h264 High · 24 fps · no audio
 *   category-<chapter>-mobile.mp4   1080×1920 · centre crop of the master
 *   posters/<poster>.jpg            1920×1080 still, taken at 25 % of the reel
 *
 * The mobile export is not a different take: it is the centre 608×1080 of the
 * 1920×1080 master scaled up to 1080×1920 (measured — the existing exports
 * match their master's centre crop at 42 dB PSNR). One master, two exports, so
 * the handset never shows a moment the desktop does not.
 *
 * Audio is dropped: every reel plays muted, looped and inline.
 *
 * Masters are NOT in Git (45 MB, see assets/masters/README.md). They are read
 * from `assets/masters/` when present, and from the repository root otherwise,
 * so an old checkout still builds.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const OUT = join("public", "videos");
const POSTERS = join(OUT, "posters");

// ── ffmpeg ─────────────────────────────────────────────────────────────────
function ffmpegPath() {
  try {
    const { path } = JSON.parse(execFileSync("node", ["-e", "process.stdout.write(JSON.stringify(require('@ffmpeg-installer/ffmpeg')))"]).toString());
    if (path && existsSync(path)) return path;
  } catch {
    /* fall through to a system binary */
  }
  return "ffmpeg";
}
const FFMPEG = ffmpegPath();

// ── the manifest ───────────────────────────────────────────────────────────
/**
 * `chapter` is the base name served by the site, `master` the source file.
 * `poster` defaults to the chapter name.
 */
const CHAPTERS = [
  { chapter: "category-skin", poster: "skin", master: "visage.mp4" },
  { chapter: "category-hair", poster: "hair", master: "cheveux.mp4" },
  { chapter: "category-body", poster: "body", master: "corps.mp4" },
  { chapter: "category-baby", poster: "baby", master: "bebe-et-maman.mp4" },
  { chapter: "category-hygiene", poster: "hygiene", master: "hygiene-intime.mp4" },
  { chapter: "category-complements", poster: "complements", master: "bien-etre.mp4" },
];

/**
 * Chapters whose master has not been delivered yet. Listed so `--check`
 * reports the holes honestly instead of pretending they do not exist.
 */
const AWAITING_MASTER = [
  { chapter: "category-sun", poster: "sun", master: "solaire.mp4" },
  { chapter: "hero-main", poster: "hero", master: "hero.mp4" },
  { chapter: "auth-login", poster: "login", master: "login.mp4" },
];

const MASTER_DIRS = [join("assets", "masters"), "."];

function findMaster(name) {
  for (const dir of MASTER_DIRS) {
    for (const candidate of [name, name.replace(/[-_]/g, " ")]) {
      const p = join(dir, candidate);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

// ── helpers ────────────────────────────────────────────────────────────────
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const checkOnly = args.includes("--check");

function run(argv, label) {
  if (dryRun) {
    process.stdout.write(`  · would run: ${label}\n`);
    return;
  }
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: ["ignore", "ignore", "pipe"] });
}

/**
 * `ffmpeg -i file` with no output file: it prints what we need on stderr and
 * exits 1, so the exit code must not be treated as a failure here.
 */
function inspect(file) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-i", file], { encoding: "utf8" });
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

/** Duration in seconds, straight from the container. */
function duration(file) {
  const m = /Duration: (\d+):(\d+):(\d+\.?\d*)/.exec(inspect(file));
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

function probe(file) {
  const text = inspect(file);
  const size = /(\d{2,5})x(\d{2,5})/.exec(text.split("Stream #")[1] ?? text);
  const dur = /Duration: (\d+):(\d+):(\d+\.?\d*)/.exec(text);
  return {
    video: size ? `${size[1]}×${size[2]}` : "?",
    seconds: dur ? Number(dur[1]) * 60 + Number(dur[2]) : null,
    bytes: statSync(file).size,
  };
}

// ── build ──────────────────────────────────────────────────────────────────
mkdirSync(POSTERS, { recursive: true });

const built = [];
const skipped = [];
const missing = [];

for (const { chapter, poster, master } of CHAPTERS) {
  const desktop = join(OUT, `${chapter}.mp4`);
  const mobile = join(OUT, `${chapter}-mobile.mp4`);
  const still = join(POSTERS, `${poster ?? chapter}.jpg`);

  if (checkOnly) continue;

  if (!force && existsSync(desktop) && existsSync(mobile) && existsSync(still)) {
    skipped.push(chapter);
    continue;
  }

  const masterPath = findMaster(master);
  if (!masterPath) {
    missing.push(`${chapter} ← ${master}`);
    continue;
  }

  const total = duration(masterPath);
  const at = total ? Math.max(0.5, total * 0.25).toFixed(2) : "2";

  process.stdout.write(`  ▸ ${chapter}  ←  ${masterPath}\n`);

  // Desktop — 1920×1080, no audio, web-optimised (fast start).
  run(
    ["-i", masterPath, "-an", "-vf", "scale=1920:1080:flags=lanczos,fps=24",
     "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "23",
     "-pix_fmt", "yuv420p", "-movflags", "+faststart", desktop],
    `${chapter}.mp4`,
  );

  // Mobile — the centre 608×1080 of the master, scaled to 1080×1920.
  run(
    ["-i", masterPath, "-an", "-vf", "crop=608:1080:656:0,scale=1080:1920:flags=lanczos,fps=24",
     "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "24",
     "-pix_fmt", "yuv420p", "-movflags", "+faststart", mobile],
    `${chapter}-mobile.mp4`,
  );

  // Poster — the frame that shows before the first paint of the reel.
  run(
    ["-ss", at, "-i", masterPath, "-frames:v", "1", "-an",
     "-vf", "scale=1920:1080:flags=lanczos", "-q:v", "4", still],
    `posters/${poster ?? chapter}.jpg`,
  );

  built.push(chapter);
}

// ── report ─────────────────────────────────────────────────────────────────
if (!dryRun) {
  process.stdout.write("\n  served assets\n");
  for (const { chapter, poster } of [...CHAPTERS, ...AWAITING_MASTER]) {
    const files = {
      desktop: join(OUT, `${chapter}.mp4`),
      mobile: join(OUT, `${chapter}-mobile.mp4`),
      poster: join(POSTERS, `${poster}.jpg`),
    };
    const present = Object.entries(files).filter(([, f]) => existsSync(f));
    if (!present.length) continue;
    const detail = present
      .map(([k, f]) =>
        k === "poster" ? `poster ${kb(statSync(f).size)}` : `${k} ${probe(f).video} ${kb(statSync(f).size)}`,
      )
      .join(" · ");
    const gaps = Object.keys(files).filter((k) => !existsSync(files[k]));
    process.stdout.write(`  ${chapter.padEnd(12)} ${detail}${gaps.length ? `   (missing: ${gaps.join(", ")})` : ""}\n`);
  }
}

if (built.length) process.stdout.write(`\n  built    ${built.join(", ")}\n`);
if (skipped.length) process.stdout.write(`  present  ${skipped.join(", ")} (use --force to rebuild)\n`);
if (missing.length) {
  process.stdout.write(`\n  masters needed in assets/masters/:\n`);
  for (const m of missing) process.stdout.write(`    · ${m}\n`);
}
for (const { chapter, master } of AWAITING_MASTER) {
  const served = join(OUT, `${chapter}.mp4`);
  if (existsSync(served)) {
    if (!findMaster(master)) {
      process.stdout.write(`  note     ${chapter}.mp4 is served, but master "${master}" is not in assets/masters/ — it cannot be rebuilt from source\n`);
    }
  } else {
    process.stdout.write(`  gap      ${chapter}.mp4 is missing and master "${master}" was never delivered\n`);
  }
}

process.stdout.write(`\n  ffmpeg   ${FFMPEG}\n`);
process.exit(0);
