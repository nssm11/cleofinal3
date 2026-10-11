/**
 * Static export for GitHub Pages (or any plain file host):
 *
 *   NEXT_PUBLIC_BASE_PATH=/cleofinal3 STATIC_EXPORT=1 → out/
 *
 * The repo name is taken from git remote (or NEXT_PUBLIC_REPO), so the same
 * command works on any project site without editing config. A copy of
 * 404.html is guaranteed for Pages' error route.
 */
import { cpSync, existsSync, readdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repo =
  process.env.NEXT_PUBLIC_REPO ??
  (() => {
    try {
      const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
      return url.replace(/\/+$/, "").replace(/\.git$/, "").split("/").pop();
    } catch {
      return null;
    }
  })();

const env = {
  ...process.env,
  STATIC_EXPORT: "1",
  NODE_ENV: "production",
  ...(repo && process.env.NEXT_PUBLIC_BASE_PATH === undefined ? { NEXT_PUBLIC_BASE_PATH: `/${repo}` } : {}),
};

console.log(`static export · basePath=${env.NEXT_PUBLIC_BASE_PATH ?? "/"}`);
const nextBin = resolve("node_modules", "next", "dist", "bin", "next");
const r = spawnSync(process.execPath, [nextBin, "build"], { env, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

const out = resolve("out");
if (existsSync(out) && !existsSync(resolve(out, "404.html"))) {
  // Pages looks for a literal 404.html; Next emits one only when not-found exists.
  const cand = readdirSync(out).find((f) => f.startsWith("404"));
  if (cand) cpSync(resolve(out, cand), resolve(out, "404.html"));
}
console.log("done → out/");
