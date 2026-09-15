import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database client with two backends behind one API.
 *
 * - `postgresql://…` (default): the real house database via node-postgres.
 * - `pglite:<dir>` (preview fallback): an embedded WASM Postgres living in
 *   the workspace, for sandboxes where no database server is reachable.
 *   Same schema, same drizzle relational API, same seed script.
 */
export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const url: string = databaseUrl;

const useLite = url.startsWith("pglite:");

type Stored = { pool: Pool; db: Db; close: () => Promise<void>; closing?: Promise<void> };
const g = globalThis as typeof globalThis & { __cleopatreDb?: Stored };

function create(): Stored {
  if (!useLite) {
    const pool = new Pool({ connectionString: url, max: 10 });
    return { pool, db: drizzlePg(pool, { schema }), close: () => pool.end() };
  }
  const dataDir =
    url.replace(/^pglite:\/\//, "").replace(/^pglite:/, "") || "./data/pglite";
  const client = new PGlite(dataDir);
  const db = drizzleLite(client, { schema }) as unknown as Db;
  // The seed script is the only `pool` consumer and only calls `.end()`.
  const pool = { end: () => client.close() } as unknown as Pool;
  return { pool, db, close: () => client.close() };
}

/**
 * ONE PGlite client per process, shared across every server chunk.
 *
 * Next production builds can import this module from several chunks
 * (root-of-the-server, SSR chunks, route chunks). Without the globalThis
 * cache each chunk would open its *own* embedded Postgres on the same data
 * directory — two clusters interleaving WAL writes into one file. That
 * corrupts the WAL on a hard exit and silently loses data on shutdown.
 */
const stored = (g.__cleopatreDb ??= create());

export const { pool, db } = stored;

/**
 * PGlite is in-process WASM: a hard exit (SIGKILL, crash) can leave the
 * write-ahead log mid-record, and the *next* process then cannot open the
 * data directory at all. Flush cleanly on shutdown instead.
 *
 * The `closing` promise lives on the shared stored client (globalThis),
 * NOT in this module: Next loads this file into several chunks, and each
 * chunk would otherwise register its own signal handler — a second
 * `client.close()` racing the first one corrupts the flush.
 */
export function closeDb(): Promise<void> {
  if (!useLite) return Promise.resolve();
  if (!stored.closing) {
    stored.closing = stored.close().catch((e) => {
      console.error("db close failed", e);
    });
  }
  return stored.closing;
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    // Take exclusive control of the signal: no other handler (Next.js
    // installs its own) may exit the process while the flush is in flight.
    process.removeAllListeners(sig);
    const bail = setTimeout(() => process.exit(1), 8_000);
    bail.unref();
    void closeDb().finally(() => {
      clearTimeout(bail);
      process.exit(0);
    });
  });
}
