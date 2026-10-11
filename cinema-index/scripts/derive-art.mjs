/**
 * derive-art.mjs — editorial treatments derived from the publication's own
 * commissioned artwork (see data/README.md). Five plates are treated variants
 * of existing commissioned images: distinct crops, tonal treatments, and
 * vignettes rendered to standalone files. Original artwork only — no external
 * or copyrighted material is used.
 *
 * Usage: node scripts/derive-art.mjs
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

const libDir = "/tmp/cinema-index-libs";
if (!existsSync(path.join(libDir, "lib", "libnss3.so"))) {
  mkdirSync(libDir, { recursive: true });
  const zlib = require("node:zlib");
  execFileSync("tar", ["-x", "-C", libDir], {
    input: zlib.brotliDecompressSync(
      readFileSync("node_modules/@sparticuz/chromium/bin/al2023.tar.br"),
    ),
  });
}
process.env.LD_LIBRARY_PATH = [path.join(libDir, "lib"), process.env.LD_LIBRARY_PATH]
  .filter(Boolean)
  .join(":");

const variants = [
  {
    out: "still-lens.jpg",
    src: "cover-story.jpg",
    pos: "68% 28%",
    zoom: 1.35,
    filter: "grayscale(1) contrast(1.35) brightness(1.02)",
    overlay: "radial-gradient(circle at 62% 32%, rgba(194,58,27,0.16), rgba(22,19,15,0.42) 72%)",
  },
  {
    out: "still-marquee.jpg",
    src: "still-curtain.jpg",
    pos: "30% 55%",
    zoom: 1.25,
    filter: "sepia(0.55) contrast(1.15) brightness(0.95)",
    overlay: "linear-gradient(0deg, rgba(194,58,27,0.18), rgba(22,19,15,0.25))",
  },
  {
    out: "still-candle.jpg",
    src: "still-rain-window.jpg",
    pos: "55% 45%",
    zoom: 1.4,
    filter: "sepia(0.5) contrast(1.3) brightness(0.72)",
    overlay: "radial-gradient(circle at 50% 58%, rgba(194,58,27,0.22), rgba(12,10,8,0.66) 70%)",
  },
  {
    out: "still-newsroom.jpg",
    src: "still-city-tram.jpg",
    pos: "40% 60%",
    zoom: 1.3,
    filter: "grayscale(1) contrast(1.45) brightness(1.08)",
    overlay: "linear-gradient(180deg, rgba(242,237,228,0.06), rgba(22,19,15,0.3))",
  },
  {
    out: "still-zinc-roofs.jpg",
    src: "still-rooftops.jpg",
    pos: "50% 18%",
    zoom: 1.45,
    filter: "grayscale(0.85) contrast(1.25) brightness(0.78) sepia(0.2)",
    overlay: "linear-gradient(180deg, rgba(22,19,15,0.45), rgba(194,58,27,0.12))",
  },
];

const W = 1200;
const H = 800;

async function main() {
  const chromiumMod = require("@sparticuz/chromium");
  const chromium = chromiumMod.default ?? chromiumMod;
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });

  for (const v of variants) {
    const srcPath = path.resolve("public/art", v.src);
    const b64 = readFileSync(srcPath).toString("base64");
    const html = `<!doctype html><html><head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; background: #16130f; }
      img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
            object-position: ${v.pos}; transform: scale(${v.zoom}); transform-origin: center;
            filter: ${v.filter}; }
      .ov { position: absolute; inset: 0; background: ${v.overlay}; mix-blend-mode: multiply; }
    </style></head><body>
      <img src="data:image/jpeg;base64,${b64}" alt="">
      <div class="ov"></div>
    </body></html>`;
    await page.setContent(html, { waitUntil: "load", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 120));
    await page.screenshot({ path: path.resolve("public/art", v.out), type: "jpeg", quality: 88 });
    console.log("wrote", v.out);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
