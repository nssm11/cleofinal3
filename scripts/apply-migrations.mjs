/**
 * Applies every drizzle/*.sql migration to a PGlite directory, one statement
 * at a time.
 *
 * Why not `db.exec(file)`: PGlite runs a multi-statement string as a single
 * implicit transaction, and PostgreSQL refuses to *use* an enum value added by
 * `ALTER TYPE … ADD VALUE` inside the transaction that added it (error 55P04).
 * Migration 0003 does exactly that, so the file has to be split. The splitter
 * below understands dollar-quoted bodies, string literals, quoted identifiers
 * and both comment forms — enough for these migrations, and it stays silent
 * about anything it does not understand beyond failing loudly.
 */
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

function splitStatements(sql) {
  const out = [];
  let buf = "";
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    if (ch === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      buf += sql.slice(i, end === -1 ? n : end + 1);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      buf += sql.slice(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === ch && sql[j + 1] === ch) { j += 2; continue; }
        if (sql[j] === ch) { j++; break; }
        j++;
      }
      buf += sql.slice(i, j);
      i = j;
      continue;
    }
    if (ch === "$") {
      const m = /^\$[A-Za-z_0-9]*\$/.exec(sql.slice(i));
      if (m) {
        const tag = m[0];
        const end = sql.indexOf(tag, i + tag.length);
        const stop = end === -1 ? n : end + tag.length;
        buf += sql.slice(i, stop);
        i = stop;
        continue;
      }
    }
    if (ch === ";") {
      out.push(buf.trim());
      buf = "";
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter((s) => s.replace(/--[^\n]*/g, "").trim().length > 0);
}

const dir = process.argv[2] ?? "./data/pglite";
const db = new PGlite(dir);
const files = readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const statements = splitStatements(readFileSync(`drizzle/${f}`, "utf8"));
  for (const statement of statements) await db.exec(statement);
  console.log(`applied ${f} (${statements.length} statements)`);
}
await db.close();
