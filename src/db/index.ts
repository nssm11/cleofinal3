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

type Stored = { pool: Pool; db: Db };
const g = globalThis as typeof globalThis & { __cleopatreDb?: Stored };

function create(): Stored {
  if (!useLite) {
    const pool = new Pool({ connectionString: url, max: 10 });
    return { pool, db: drizzlePg(pool, { schema }) };
  }
  const dataDir =
    url.replace(/^pglite:\/\//, "").replace(/^pglite:/, "") || "./data/pglite";
  const client = new PGlite(dataDir);
  const db = drizzleLite(client, { schema }) as unknown as Db;
  // The seed script is the only `pool` consumer and only calls `.end()`.
  const pool = { end: () => client.close() } as unknown as Pool;
  return { pool, db };
}

const stored = g.__cleopatreDb ?? create();
if (process.env.NODE_ENV !== "production") g.__cleopatreDb = stored;

export const { pool, db } = stored;
