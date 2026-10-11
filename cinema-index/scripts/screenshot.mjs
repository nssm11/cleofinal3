/**
 * Screenshot QA pipeline — runs headless chromium (bundled via npm) against the
 * dev server and writes desktop + mobile captures to qa/shots/.
 *
 * Usage: node scripts/screenshot.mjs [baseUrl] [outDir]
 * Requires: LD_LIBRARY_PATH pointing at the extracted al2023 libs (handled here).
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

async function ensureLibs() {
  const libDir = "/tmp/cinema-index-libs";
  if (!existsSync(path.join(libDir, "lib", "libnss3.so"))) {
    mkdirSync(libDir, { recursive: true });
    const zlib = require("node:zlib");
    const fs = require("node:fs");
    const tarball = path.join(
      "node_modules",
      "@sparticuz",
      "chromium",
      "bin",
      "al2023.tar.br",
    );
    const buf = zlib.brotliDecompressSync(fs.readFileSync(tarball));
    execFileSync("tar", ["-x", "-C", libDir], { input: buf });
  }
  const libPath = path.join(libDir, "lib");
  process.env.LD_LIBRARY_PATH = [libPath, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
  return libPath;
}

const routes = [
  ["home", "/"],
  ["catalog", "/catalog"],
  ["collections", "/catalog?view=collections"],
  ["film", "/film/man-with-a-movie-camera"],
  ["film-horror", "/film/nosferatu"],
  ["series", "/series/les-vampires"],
  ["watch", "/watch/man-with-a-movie-camera"],
  ["watchlist", "/watchlist"],
  ["history", "/history"],
  ["notfound", "/no-such-page"],
];

const viewports = [
  ["desktop", { width: 1440, height: 900, deviceScaleFactor: 1 }],
  [
    "mobile",
    {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  ],
];

async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:5173";
  const outDir = process.argv[3] ?? "qa/shots";
  mkdirSync(outDir, { recursive: true });

  await ensureLibs();
  const chromiumMod = require("@sparticuz/chromium");
  const chromium = chromiumMod.default ?? chromiumMod;
  const puppeteer = require("puppeteer-core");

  const exe = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: [...chromium.args, "--lang=ar"],
    executablePath: exe,
    headless: true,
    defaultViewport: null,
  });

  const log = [];
  for (const [vpName, viewport] of viewports) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    page.on("pageerror", (err) =>
      log.push(`[pageerror ${vpName}] ${err.message}`),
    );
    page.on("console", (msg) => {
      if (msg.type() === "error") log.push(`[console ${vpName}] ${msg.text()}`);
    });

    for (const [name, route] of routes) {
      await page
        .goto(baseUrl + route, { waitUntil: "networkidle2", timeout: 45000 })
        .catch(() => {});
      await new Promise((r) => setTimeout(r, 350));
      await page.screenshot({
        path: path.join(outDir, `${name}-${vpName}.png`),
        fullPage: vpName === "desktop",
      });
      log.push(`shot ${name}-${vpName}`);
    }

    // search overlay state
    await page
      .goto(baseUrl + "/", { waitUntil: "networkidle2", timeout: 45000 })
      .catch(() => {});
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    // click the search action instead (keyboard shortcut may not exist)
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const b = btns.find((x) => x.textContent?.includes("بحث"));
      if (b) {
        b.click();
        return true;
      }
      return false;
    });
    if (clicked) {
      await new Promise((r) => setTimeout(r, 250));
      await page.type("#search-input", "1922");
      await new Promise((r) => setTimeout(r, 350));
      await page.screenshot({
        path: path.join(outDir, `search-${vpName}.png`),
      });
      log.push(`shot search-${vpName}`);
    }

    // mobile menu state (mobile only)
    if (vpName === "mobile") {
      await page
        .goto(baseUrl + "/", { waitUntil: "networkidle2", timeout: 45000 })
        .catch(() => {});
      const opened = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")];
        const b = btns.find((x) => x.textContent?.includes("قائمة"));
        if (b) {
          b.click();
          return true;
        }
        return false;
      });
      if (opened) {
        await new Promise((r) => setTimeout(r, 250));
        await page.screenshot({ path: path.join(outDir, `menu-mobile.png`) });
        log.push("shot menu-mobile");
      }
    }

    await page.close();
  }

  await browser.close();
  writeFileSync(path.join(outDir, "log.txt"), log.join("\n"));
  console.log(log.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
