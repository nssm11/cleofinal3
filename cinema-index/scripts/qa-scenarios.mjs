/**
 * Scenario QA — runs the seven required product scenarios against the live dev
 * server in headless chromium and writes desktop/mobile screenshots.
 *
 * NOTE ON NETWORK: this sandbox's headless browser cannot reach external media
 * hosts (upload.wikimedia.org). Scenario 1 therefore asserts full playback
 * wiring (real verified source URL, quality ladder, player states) and records
 * the honest error state when the sandbox blocks the media request; actual
 * streaming is verified through the provider API evidence in sources.ts and on
 * a real browser with open network.
 *
 * Usage: node scripts/qa-scenarios.mjs [baseUrl] [outDir]
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
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

const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`);
};

async function shot(page, outDir, name) {
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: true,
  });
}

async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:5173";
  const outDir = process.argv[3] ?? "qa/scenarios";
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
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) =>
    console.log("  [pageerror]", String(e).slice(0, 160)),
  );

  /* ---- 1. playable movie: real verified source + quality ladder ---- */
  await page.goto(`${baseUrl}/watch/nosferatu`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 2500));
  const src1 = await page.$eval("video", (v) => v.getAttribute("src") ?? "");
  const qCount = await page.$$eval(
    "button",
    (bs) =>
      bs.filter((b) => /^\d{3,4}p|^أصلية|×/.test(b.textContent ?? "")).length,
  );
  const verifyState = await page
    .$eval('[data-testid="verify-state"]', (el) => el.textContent ?? "")
    .catch(() => "");
  const srcOk = src1.startsWith("https://upload.wikimedia.org/");
  record(
    "1. فيلم قابل للتشغيل",
    srcOk && qCount >= 2,
    `video src=${src1.slice(0, 72)}… · جودات=${qCount} · حالة التحقق="${verifyState.trim().slice(0, 40)}"`,
  );
  await shot(page, outDir, "01-watch-nosferatu-desktop");

  /* ---- 2. series episode navigation ---- */
  await page.goto(`${baseUrl}/series/les-vampires`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const epLinks = await page.$$eval(
    "a",
    (as) =>
      as.filter((a) =>
        /\/watch\/les-vampires\/\d+/.test(a.getAttribute("href") ?? ""),
      ).length,
  );
  await page.goto(`${baseUrl}/watch/les-vampires/1`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const srcEp1 = await page.$eval("video", (v) => v.getAttribute("src") ?? "");
  await page.goto(`${baseUrl}/watch/les-vampires/3`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const srcEp3 = await page.$eval("video", (v) => v.getAttribute("src") ?? "");
  const navOk =
    epLinks >= 10 && srcEp1 !== srcEp3 && srcEp3.includes("Les_Vampires");
  record(
    "2. تنقّل حلقات المسلسل",
    navOk,
    `روابط حلقات=${epLinks} · م1=${srcEp1.slice(-40)} · م3=${srcEp3.slice(-40)}`,
  );
  await shot(page, outDir, "02-series-ep3-desktop");

  /* ---- 3. Arabic subtitles: enable / disable / provenance ---- */
  await page.goto(`${baseUrl}/watch/nosferatu`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await page.$$eval("button", (bs) => {
    const b = bs.find((x) => (x.textContent ?? "").includes("العربية"));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const trackSrc = await page
    .$eval("track", (t) => t.getAttribute("src") ?? "")
    .catch(() => "");
  const origin = await page
    .$eval('[data-testid="sub-origin"]', (el) => el.textContent ?? "")
    .catch(() => "");
  await page.$$eval("button", (bs) => {
    const b = bs.find((x) => (x.textContent ?? "").includes("إيقاف الترجمة"));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const trackAfterOff = await page.$("track");
  record(
    "3. ترجمة عربية",
    trackSrc.startsWith("blob:") && origin.includes("أُنتجت") && !trackAfterOff,
    `مسار الترجمة blob · الأصل مُصرَّح · الإيقاف يزيل المسار=${!trackAfterOff}`,
  );

  /* ---- 4. legitimate downloads ---- */
  const dl = await page.$$eval("a[download]", (as) =>
    as.map((a) => ({
      href: a.getAttribute("href") ?? "",
      label: a.parentElement?.textContent ?? "",
    })),
  );
  const dlOk =
    dl.length >= 2 &&
    dl.every((d) => d.href.startsWith("https://upload.wikimedia.org/")) &&
    dl.some((d) => d.label.includes("الحجم الحقيقي")) &&
    dl.some((d) => d.label.includes("تقدير"));
  record(
    "4. تنزيل مشروط",
    dlOk,
    `صفوف تنزيل=${dl.length} · أحجام حقيقية/تقدير مُعلّمة`,
  );
  await shot(page, outDir, "04-downloads-desktop");

  /* ---- 5. metadata without video: honest unavailable state ---- */
  await page.goto(`${baseUrl}/watch/no-such-work`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const honest = await page.evaluate(() => document.body.innerText);
  const noFakePlay = !(await page.$("video"));
  record(
    "5. بيانات بلا فيديو",
    honest.includes("العنوان غير موجود") && noFakePlay,
    "حالة صريحة «غير موجود» — بلا زر تشغيل وهمي",
  );

  /* ---- 6. broken/expired source: honest failure + retry ---- */
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("upload.wikimedia.org")) req.abort();
    else req.continue();
  });
  await page.goto(`${baseUrl}/watch/big-buck-bunny`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 3500));
  const errText = await page.evaluate(() => document.body.innerText);
  const hasRetry =
    errText.includes("إعادة المحاولة") || errText.includes("تعذّر");
  record(
    "6. مصدر مكسور/منتهي",
    hasRetry,
    "الحظر يُظهر رسالة فشل صريحة مع إعادة محاولة (لا تزييف)",
  );
  await shot(page, outDir, "06-broken-source-desktop");
  await page.setRequestInterception(false);
  page.removeAllListeners("request");

  /* ---- 7. no Arabic subs: honest empty state ---- */
  await page.goto(`${baseUrl}/watch/les-vampires/1`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const subsNone = await page
    .$eval('[data-testid="subs-none"]', (el) => el.textContent ?? "")
    .catch(() => "");
  record(
    "7. لا توجد ترجمة عربية",
    subsNone.includes("لا توجد ترجمة عربية") && subsNone.includes("لا نخترع"),
    "رسالة غياب صريحة بلا مسارات مزيّفة",
  );

  /* ---- mobile capture ---- */
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await page.goto(`${baseUrl}/watch/nosferatu`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, outDir, "01-watch-nosferatu-mobile");
  await page.goto(`${baseUrl}/series/les-vampires`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await shot(page, outDir, "02-series-mobile");

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\nScenarios: ${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
