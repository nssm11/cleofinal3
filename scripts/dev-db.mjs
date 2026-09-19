#!/usr/bin/env node
/**
 * DEV-DB — an isolated PostgreSQL cluster that belongs to this project.
 *
 *   node scripts/dev-db.mjs start    resolve a database, then print its URL
 *   node scripts/dev-db.mjs stop     stop the project-local cluster
 *   node scripts/dev-db.mjs reset    destroy the local cluster and rebuild it
 *   node scripts/dev-db.mjs status   running / stopped, and where
 *   node scripts/dev-db.mjs url      print only the resolved URL (scriptable)
 *
 * `CLEOPATRE_FORCE_LOCAL_DB=1` ignores a reachable `DATABASE_URL` and starts
 * the project's own cluster anyway — for when you want a clean database
 * without editing `.env`.
 *
 * Contract, kept identical to what `start.ps1` and the README expect:
 *
 *   - a database the developer already runs is NEVER modified, stopped or
 *     removed: if `DATABASE_URL` answers, it is reused as-is and printed ;
 *   - otherwise a cluster is created in `.devdb/` and started as a real
 *     daemon (pg_ctl), so it outlives this process ;
 *   - the resolved address is written back into `.env`, and a full `.env`
 *     (DATABASE_URL + random SESSION_SECRET + NEXT_PUBLIC_SITE_URL) is
 *     created when none exists ;
 *   - state lives in `.devdb/state.json` as `{ "port": … }`, the log in
 *     `.devdb/logs/postgres.log` ;
 *   - required extensions (`unaccent`, `pg_trgm`) are created once the
 *     cluster answers.
 *
 * Two safety rules, both learned the hard way:
 *
 *   1. A listening port does not prove the server is ours. If the port
 *      answers while the project data directory is absent, we stop with a
 *      clear message instead of pushing a schema into someone else's
 *      database.
 *   2. The cluster is started through `pg_ctl`, never through the
 *      `embedded-postgres` library API: that library installs a process-exit
 *      hook which stops every server it started, so the cluster used to die
 *      the moment this script returned. `pg_ctl` hands control back
 *      immediately and leaves the server alive.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { connect as netConnect } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

// ── configuration ──────────────────────────────────────────────────────────
const DEV_DIR = ".devdb";
const DATA_DIR = join(DEV_DIR, "data");
const LOG_DIR = join(DEV_DIR, "logs");
const LOG_FILE = join(LOG_DIR, "postgres.log");
const STATE_FILE = join(DEV_DIR, "state.json");
const ENV_FILE = ".env";

const PORT = Number(process.env.DEV_DB_PORT ?? 5433);
const USER = process.env.DEV_DB_USER ?? "cleopatre";
const PASSWORD = process.env.DEV_DB_PASSWORD ?? "cleopatre";
const DATABASE = process.env.DEV_DB_NAME ?? "cleopatre_dev";
const HOST = "127.0.0.1";
const LOCAL_URL = `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}`;

const isWindows = process.platform === "win32";

// ── small helpers ──────────────────────────────────────────────────────────
const say = (m) => process.stdout.write(`${m}\n`);
const warn = (m) => process.stderr.write(`${m}\n`);
const fail = (m) => {
  warn(`dev-db: ${m}`);
  process.exit(1);
};

/**
 * Locate the PostgreSQL binaries shipped by `embedded-postgres`.
 *
 * The platform packages only ship `initdb`, `pg_ctl` and `postgres` — no
 * `psql`, no `createdb`, no `pg_isready` — so every other operation goes
 * through the `pg` client instead, which is a real dependency of the app.
 *
 * We reach the binaries by walking the filesystem rather than through
 * `require.resolve`: those packages export a single entry point, so
 * `./package.json` is not resolvable by design.
 */
function binaries() {
  const arch = process.arch;
  const platform = process.platform;
  const wanted =
    platform === "darwin"
      ? `darwin-${arch}`
      : platform === "win32"
        ? "windows-x64"
        : `linux-${arch}`;

  const roots = [];
  for (let dir = root; ; dir = dirname(dir)) {
    roots.push(join(dir, "node_modules", "@embedded-postgres"));
    if (dirname(dir) === dir) break;
  }

  const candidates = [];
  for (const base of roots) {
    if (!existsSync(base)) continue;
    candidates.push(join(base, wanted, "native", "bin"));
    // Whatever else npm installed for this machine (hoisting, pnpm, yarn PnP
    // off) is a valid fallback: the binaries are identical in version.
    for (const entry of readdirSync(base)) {
      candidates.push(join(base, entry, "native", "bin"));
    }
  }

  const exe = isWindows ? "pg_ctl.exe" : "pg_ctl";
  const bin = candidates.find((d) => existsSync(join(d, exe)));
  if (!bin) fail("PostgreSQL binaries not found — run `npm install` first.");

  const path = (name) => join(bin, isWindows ? `${name}.exe` : name);
  for (const name of ["initdb", "pg_ctl", "postgres"]) {
    if (!existsSync(path(name))) fail(`missing binary: ${path(name)}`);
  }
  return { initdb: path("initdb"), pg_ctl: path("pg_ctl"), postgres: path("postgres") };
}

const BIN = binaries();

/** `.env` as a list of lines, preserving comments and unknown keys. */
function readEnv() {
  return existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split(/\r?\n/) : [];
}

function envValue(lines, key) {
  const hit = lines.find((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
  return hit ? hit.slice(hit.indexOf("=") + 1).trim() : null;
}

/** Replace one key in place, or append it. Nothing else in the file moves. */
function setEnvValue(lines, key, value) {
  const re = new RegExp(`^\\s*${key}\\s*=`);
  const i = lines.findIndex((l) => re.test(l));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
  return lines;
}

/** Does a PostgreSQL server answer at this URL, right now? */
async function answers(url, timeoutMs = 2500) {
  if (!url || !/^postgres(ql)?:\/\//.test(url)) return false;
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: timeoutMs });
  try {
    await client.connect();
    await client.query("select 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Is something listening on the cluster port? A TCP probe, because the
 * platform packages ship no `pg_isready`.
 */
const portAnswers = () =>
  new Promise((done) => {
    const socket = netConnect({ host: HOST, port: PORT });
    const finish = (v) => {
      socket.destroy();
      done(v);
    };
    socket.setTimeout(800);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

const clusterExists = () => existsSync(join(DATA_DIR, "PG_VERSION"));

/**
 * Write the resolved address into `.env`.
 *
 * Only `DATABASE_URL` is ever rewritten on an existing file, and only for a
 * cluster this script started. When no `.env` exists at all, a complete one is
 * created — including a real random `SESSION_SECRET`, because the application
 * refuses to boot in production with an example value.
 */
function persistEnv(url) {
  const had = existsSync(ENV_FILE);
  const lines = readEnv();
  setEnvValue(lines, "DATABASE_URL", url);
  if (!had) {
    setEnvValue(lines, "SESSION_SECRET", randomBytes(32).toString("hex"));
    setEnvValue(lines, "NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  }
  writeFileSync(ENV_FILE, `${lines.filter((l, i, a) => !(l === "" && i === a.length - 1)).join("\n")}\n`);
  say(had ? `  .env      DATABASE_URL → ${url}` : `  .env      created (DATABASE_URL + random SESSION_SECRET) → ${url}`);
}

function writeState(url) {
  mkdirSync(DEV_DIR, { recursive: true });
  writeFileSync(
    STATE_FILE,
    `${JSON.stringify({ port: PORT, host: HOST, user: USER, database: DATABASE, dataDir: DATA_DIR, url, pid: clusterPid() ?? null }, null, 2)}\n`,
  );
}

/** pg_ctl reports the postmaster pid, or nothing when the cluster is down. */
function clusterPid() {
  const r = spawnSync(BIN.pg_ctl, ["-D", DATA_DIR, "status"], { encoding: "utf8" });
  const m = /PID:\s*(\d+)/.exec(r.stdout ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * Resolve the database to use: the developer's own server if it answers,
 * otherwise the project-local cluster. This is the command `start.ps1` calls.
 */
async function start() {
  // 1. Never touch a server the developer already runs — unless the
  //    developer explicitly asks for the project's own cluster.
  const lines = readEnv();
  const declared = process.env.DATABASE_URL ?? envValue(lines, "DATABASE_URL");
  const forceLocal = ["1", "true", "yes"].includes(String(process.env.CLEOPATRE_FORCE_LOCAL_DB ?? "").toLowerCase());
  if (!forceLocal && declared && (await answers(declared))) {
    say(`  database  reusing the server you already run → ${declared}`);
    say(`  (this project will not modify, stop or remove it)`);
    say(declared.replace(/\s/g, ""));
    return;
  }

  // 2. A port that answers without our data directory is somebody else's.
  if (!clusterExists() && (await portAnswers())) {
    fail(
      `port ${PORT} already answers, but ${DATA_DIR} does not exist — that server is not this project's.\n` +
        `         Stop it, or choose another port with DEV_DB_PORT=5434 node scripts/dev-db.mjs start`,
    );
  }

  mkdirSync(LOG_DIR, { recursive: true });

  // 3. Create the cluster once.
  if (!clusterExists()) {
    rmSync(DATA_DIR, { recursive: true, force: true });
    mkdirSync(dirname(DATA_DIR), { recursive: true });
    say(`  initdb    ${DATA_DIR}`);
    const args = ["-D", DATA_DIR, "-U", USER, "-E", "UTF8", "--auth=trust"];
    let r = spawnSync(BIN.initdb, args, { encoding: "utf8" });
    if (r.status !== 0) {
      // No usable locale in this environment — fall back to the C locale.
      warn(`  initdb    default locale refused, retrying with C`);
      r = spawnSync(BIN.initdb, [...args, "--locale=C"], { encoding: "utf8" });
    }
    if (r.status !== 0) fail(`initdb failed:\n${r.stderr ?? r.stdout ?? ""}`);
  }

  // 4. Start it as a daemon (pg_ctl returns immediately, server stays up).
  if (!clusterPid()) {
    say(`  pg_ctl    starting on port ${PORT}`);
    const options = isWindows ? `-p ${PORT}` : `-p ${PORT} -k ${join(root, DEV_DIR)}`;
    const r = spawnSync(
      BIN.pg_ctl,
      ["-D", DATA_DIR, "-l", LOG_FILE, "-w", "-t", "60", "-o", options, "start"],
      { encoding: "utf8" },
    );
    if (r.status !== 0) fail(`could not start the cluster — see ${LOG_FILE}\n${r.stderr ?? r.stdout ?? ""}`);
  } else {
    say(`  pg_ctl    already running (pid ${clusterPid()})`);
  }

  // 5. Wait for a real connection — against the maintenance database, since
  //    the project database is created by the very next step.
  const ADMIN_URL = `postgresql://${USER}@${HOST}:${PORT}/postgres`;
  for (let i = 0; i < 60; i++) {
    if (await answers(ADMIN_URL, 1000)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!(await answers(ADMIN_URL, 2000))) fail(`cluster started but does not answer — see ${LOG_FILE}`);

  // 6. Database and extensions, idempotent.
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  try {
    await admin.connect();
    const exists = await admin.query("select 1 from pg_database where datname = $1", [DATABASE]);
    if (exists.rowCount === 0) {
      await admin.query(`create database "${DATABASE}"`);
      say(`  createdb  ${DATABASE}`);
    }
  } finally {
    await admin.end().catch(() => {});
  }

  const db = new pg.Client({ connectionString: LOCAL_URL });
  try {
    await db.connect();
    for (const ext of ["unaccent", "pg_trgm"]) {
      await db.query(`create extension if not exists ${ext}`);
    }
    say(`  extensions  unaccent, pg_trgm ready`);
  } finally {
    await db.end().catch(() => {});
  }

  if (!(await answers(LOCAL_URL, 2000))) fail(`database ${DATABASE} is not reachable — see ${LOG_FILE}`);

  writeState(LOCAL_URL);
  persistEnv(LOCAL_URL);
  say(LOCAL_URL);
}

function stop() {
  if (!clusterExists()) {
    say("  dev-db    no project-local cluster to stop");
    return;
  }
  const r = spawnSync(BIN.pg_ctl, ["-D", DATA_DIR, "-m", "fast", "-w", "-t", "30", "stop"], { encoding: "utf8" });
  say(r.status === 0 ? "  dev-db    cluster stopped" : "  dev-db    cluster was not running");
}

async function reset() {
  if (clusterExists()) spawnSync(BIN.pg_ctl, ["-D", DATA_DIR, "-m", "immediate", "-w", "-t", "30", "stop"], { encoding: "utf8" });
  rmSync(DATA_DIR, { recursive: true, force: true });
  say("  reset     cluster removed");
  await start();
}

async function status() {
  const pid = clusterExists() ? clusterPid() : null;
  if (pid) {
    let version = "?";
    try {
      const c = new pg.Client({ connectionString: LOCAL_URL, connectionTimeoutMillis: 2000 });
      await c.connect();
      version = (await c.query("show server_version")).rows[0].server_version;
      await c.end();
    } catch {
      /* reported below */
    }
    say(`  running   pid ${pid} · port ${PORT} · PostgreSQL ${version}`);
    say(`  url       ${LOCAL_URL}`);
    return 0;
  }
  const declared = process.env.DATABASE_URL ?? envValue(readEnv(), "DATABASE_URL");
  if (declared && (await answers(declared))) {
    say(`  stopped   project-local cluster; using the server at ${declared}`);
    return 0;
  }
  say("  stopped   no project-local cluster, no reachable DATABASE_URL");
  say(`  hint      node scripts/dev-db.mjs start`);
  return 0;
}

/** Print the URL that should be used, starting the cluster if needed. */
async function url() {
  const declared = process.env.DATABASE_URL ?? envValue(readEnv(), "DATABASE_URL");
  if (declared && (await answers(declared))) {
    say(declared);
    return;
  }
  if (clusterExists() && clusterPid()) {
    say(LOCAL_URL);
    return;
  }
  await start();
}

const command = process.argv[2] ?? "start";
const run = { start, stop, reset, status, url }[command];

if (!run) {
  fail(`unknown command "${command}" — expected start | stop | reset | status | url`);
}

// `pg_ctl` must never inherit a PG* environment that points elsewhere.
for (const key of Object.keys(process.env)) {
  if (/^PG(HOST|PORT|USER|PASSWORD|DATABASE)?$/.test(key)) delete process.env[key];
}

const code = (await run()) ?? 0;
process.exit(code === 0 ? 0 : code);
