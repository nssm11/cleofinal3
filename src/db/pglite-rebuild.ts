/**
 * PGlite data-dir recovery for this sandbox.
 *
 * A hard-exited `next start` can leave the embedded WAL mid-record, after
 * which no process can open ./data/pglite at all (WASM aborts on crash
 * recovery). This script rebuilds the data directory from scratch:
 *
 *   1. removes ./data/pglite
 *   2. re-applies every drizzle/*.sql migration in order
 *   3. re-seeds the standard test sessions (support + one customer)
 *
 * Usage:  npx tsx src/db/pglite-rebuild.ts
 * Then:   npm run db:seed
 *
 * The application itself now closes PGlite gracefully on SIGINT/SIGTERM
 * (see src/db/index.ts) — this script is the last-resort recovery path.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "pglite");

/** Split SQL into statements, honouring '...' strings, dollar-quoted bodies, and -- comments. */
function splitStatements(sqlText: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inSingle = false;
  let dollarTag: string | null = null;
  while (i < sqlText.length) {
    const ch = sqlText[i];
    const two = sqlText.slice(i, i + 2);
    if (inSingle) {
      cur += ch;
      if (ch === "'" && two === "''") {
        cur += "'";
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i++;
      continue;
    }
    if (dollarTag) {
      if (sqlText.startsWith(dollarTag, i)) {
        cur += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      cur += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sqlText.slice(i));
      if (m) {
        dollarTag = m[0];
        cur += m[0];
        i += m[0].length;
        continue;
      }
    }
    if (two === "--") {
      while (i < sqlText.length && sqlText[i] !== "\n") i++;
      continue; // drop line comment
    }
    if (ch === ";") {
      const s = cur.trim();
      if (s) out.push(s);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  const s = cur.trim();
  if (s) out.push(s);
  return out;
}

async function main() {
  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log("removed", DATA_DIR);

  const client = new PGlite(DATA_DIR);
  const files = readdirSync(path.join(ROOT, "drizzle")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const stmts = splitStatements(readFileSync(path.join(ROOT, "drizzle", f), "utf8"));
    for (const s of stmts) await client.exec(s);
    console.log(`  ✓ ${f} (${stmts.length} statements)`);
  }
  await client.close();
  console.log("SCHEMA OK — now run: npm run db:seed");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
