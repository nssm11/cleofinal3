/**
 * Re-maps the vocabulary of the previous interface onto the new design system.
 *
 * The redesign replaces the material language wholesale: the old palette
 * (paper / champagne / noir / os-*) no longer exists in globals.css. Any file
 * still carrying an old name would therefore render as unstyled HTML. This
 * script rewrites those names in place, once, so every screen that has not yet
 * been rebuilt by hand still renders inside the new system — and so that no
 * dead legacy token survives in the source.
 *
 * Run: node scripts/migrate-design-tokens.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

/** Literal first pass — the names that would collide with a shorter token. */
const LITERALS = [
  ["--text-os-metric-lg", "--text-mega"],
  ["--text-os-metric", "--text-h2"],
  ["--text-os-micro", "--text-micro"],
  ["--text-cine-word", "--text-poster"],
  ["--text-cine-title", "--text-mega"],
  ["text-os-metric-lg", "text-mega"],
  ["text-os-metric", "text-h2"],
  ["text-os-micro", "text-micro"],
  ["text-cine-word", "text-poster"],
  ["text-cine-title", "text-mega"],
  ["text-display-xl", "text-h1"],
  ["text-display-lg", "text-h1"],
  ["text-display-md", "text-h2"],
  ["text-display-sm", "text-h3"],
  ["text-eyebrow", "text-label"],
  ["text-small", "text-meta"],
  ["shadow-os-sheet", "shadow-sheet"],
  ["shadow-os-lift", "shadow-lift"],
  ["shadow-os-drawer", "shadow-tray"],
  ["shadow-os-palette", "shadow-palette"],
  ["shadow-whisper", "shadow-sheet"],
  ["shadow-soft", "shadow-sheet"],
  ["shadow-float", "shadow-lift"],
  ["shadow-drawer", "shadow-tray"],
  ["shadow-halo", "shadow-signal"],
  ["shadow-inset-light", "shadow-sheet"],
  ["py-section-sm", "py-block"],
  ["py-section", "py-block-lg"],
  ["py-rhythm-lg", "py-block-lg"],
  ["py-rhythm", "py-block"],
  ["py-band-lg", "py-band"],
];

/**
 * General pass — colour and type families. Applied with a token boundary on
 * both sides, so `champagne` never eats into `champagne-soft`.
 */
const TOKENS = [
  // grounds
  ["paper-2", "canvas-2"],
  ["paper", "canvas"],
  ["ivory", "porcelain"],
  ["cream", "mist"],
  ["marble", "canvas-2"],
  ["linen", "canvas-2"],
  ["albatre", "mist"],
  ["stone-2", "line-strong"],
  ["stone", "line"],
  ["sand-2", "faint"],
  ["sand", "faint"],
  ["glow", "iodine-wash"],
  // ink
  ["ink", "carbon"],
  ["charcoal-2", "steel"],
  ["charcoal", "carbon"],
  ["muted-2", "faint"],
  // signature
  ["champagne-3", "iodine"],
  ["champagne-2", "iodine-deep"],
  ["champagne-soft", "iodine-wash"],
  ["champagne", "iodine"],
  ["brass", "iodine-deep"],
  // campaign worlds
  ["cine-noir-2", "petrol-2"],
  ["cine-noir", "petrol"],
  ["cine-ivory", "chalk"],
  ["cine-mist", "chalk-muted"],
  ["cine-faint", "chalk-faint"],
  ["cine-gold", "iodine"],
  ["cine-line", "night-line"],
  ["noir-2", "petrol-2"],
  ["noir", "petrol"],
  ["braise-2", "petrol-2"],
  ["braise", "petrol"],
  ["terra-2", "iodine-deep"],
  ["terra-soft", "iodine-wash"],
  ["terra", "iodine-deep"],
  // semantics
  ["success-soft", "ok-wash"],
  ["success", "ok"],
  ["warning-soft", "amber-wash"],
  ["warning", "amber"],
  ["error-soft", "crit-wash"],
  ["error", "crit"],
  // the instrument
  ["admin-panel-2", "ops-sheet-2"],
  ["admin-panel", "ops-sheet"],
  ["admin-border", "ops-line"],
  ["admin-text", "ops-ink"],
  ["admin-muted", "ops-muted"],
  ["admin-gold", "ops-signal"],
  ["admin-bg", "ops-canvas"],
  ["os-canvas-2", "ops-canvas"],
  ["os-canvas", "ops-canvas"],
  ["os-surface-3", "ops-sheet-2"],
  ["os-surface-2", "ops-sheet-2"],
  ["os-surface", "ops-sheet"],
  ["os-line-soft", "ops-line-soft"],
  ["os-line-strong", "ops-line"],
  ["os-line", "ops-line"],
  ["os-ink-line", "ops-night-2"],
  ["os-ink-3", "ops-night-2"],
  ["os-ink-2", "ops-night-2"],
  ["os-ink", "ops-night"],
  ["os-onink-muted", "ops-chalk-muted"],
  ["os-onink-faint", "ops-chalk-muted"],
  ["os-onink", "ops-chalk"],
  ["os-text", "ops-ink"],
  ["os-muted", "ops-muted"],
  ["os-faint", "ops-faint"],
  ["os-gold-soft", "iodine-wash"],
  ["os-gold-2", "ops-signal"],
  ["os-gold", "ops-signal"],
  ["os-crit-soft", "crit-wash"],
  ["os-crit", "crit"],
  ["os-warn-soft", "amber-wash"],
  ["os-warn", "amber"],
  ["os-ok-soft", "ok-wash"],
  ["os-ok", "ok"],
  ["os-info-soft", "sea-wash"],
  ["os-info", "sea"],
  // spacing
  ["section-sm", "block"],
  ["section", "block-lg"],
  ["rhythm-lg", "block-lg"],
  ["rhythm", "block"],
  ["band-lg", "band"],
];

function escape(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const files = execSync("find src -type f \\( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \\)", {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter((f) => !f.endsWith("globals.css"));

let changed = 0;
let edits = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [from, to] of LITERALS) {
    const re = new RegExp(`(^|[\\s"'\`:])${escape(from)}(?![\\w-])`, "g");
    after = after.replace(re, (m, p1) => `${p1}${to}`);
  }
  for (const [from, to] of TOKENS) {
    // A design token is always glued to a utility prefix (`bg-`, `text-`,
    // `--color-`, `border-`…), so the boundary on the left is the dash itself.
    const re = new RegExp(`-${escape(from)}(?![\\w-])`, "g");
    after = after.replace(re, `-${to}`);
  }
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
    edits += before.split("\n").reduce((n, line, i) => n + (line === after.split("\n")[i] ? 0 : 1), 0);
  }
}

console.log(`rewrote ${changed} files`);
