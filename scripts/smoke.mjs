/**
 * Smoke — hit the real server with the real routes and assert what matters.
 *
 *   BASE_URL=http://localhost:3000 node scripts/smoke.mjs
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const routes = ["/", "/films", "/films/nosferatu", "/series", "/series/dragnet", "/collections", "/collections/noir", "/search", "/list", "/about", "/watch/films/detour", "/watch/series/sherlock-holmes-1954/lady-beryl"];
const absent = ["/films/nope-not-here", "/collections/zzz"];

let bad = 0;
for (const r of routes) {
  const res = await fetch(BASE + r);
  const html = await res.text();
  const ok =
    res.status === 200 &&
    html.includes('dir="rtl"') &&
    html.includes("خيال") &&
    !html.includes("__next_error__") &&
    html.includes("<svg");
  console.log(`${ok ? "✓" : "✗"} ${res.status} ${r} (${(html.length / 1024).toFixed(0)}kb)`);
  if (!ok) bad++;
}
for (const r of absent) {
  const res = await fetch(BASE + r);
  const ok = res.status === 404;
  console.log(`${ok ? "✓" : "✗"} ${res.status} ${r} (expect 404)`);
  if (!ok) bad++;
}

// The catalog search API shape lives client-side; instead verify data wiring:
const home = await (await fetch(BASE + "/")).text();
for (const term of ["برنامج الليلة", "قشعريرة", "الورشة المفتوحة", "دفتر الحقوق"]) {
  const ok = home.includes(term);
  console.log(`${ok ? "✓" : "✗"} home contains «${term}»`);
  if (!ok) bad++;
}

process.exit(bad === 0 ? 0 : 1);
