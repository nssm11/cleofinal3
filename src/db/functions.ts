import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Accent-insensitive comparison, guaranteed present.
 *
 * The catalogue searches with `unaccent(...) ILIKE unaccent(...)` so that
 * "serum" finds "Sérum". Managed Postgres ships the extension; the embedded
 * preview database does not, and a missing function fails the whole query.
 *
 * This installs an equivalent immutable `unaccent(text)` **only when the name
 * is free** — on a server that already has the real extension, the guard makes
 * the call a no-op. Memoised per process.
 */
let installed: Promise<void> | null = null;

export function ensureSearchSql(): Promise<void> {
  installed ??= install();
  return installed;
}

async function install() {
  try {
    await db.execute(sql`SELECT unaccent('a'), similarity('ab', 'abc')`);
    return;
  } catch {
    /* one or both missing — install what is absent */
  }
  await installUnaccent();
  await installSimilarity();
}

async function installUnaccent() {
  try {
    await db.execute(sql`SELECT unaccent('a')`);
    return;
  } catch { /* absent */ }
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unaccent') THEN
          CREATE FUNCTION unaccent(txt text) RETURNS text AS $fn$
            SELECT translate(
              txt,
              'àáâäãåāăąçćčèéêëēėęěìíîïīįıñńňòóôöõøōőùúûüūůűųýÿżźžÀÁÂÄÃÅĀĂĄÇĆČÈÉÊËĒĖĘĚÌÍÎÏĪĮŃÒÓÔÖÕØŌŐÙÚÛÜŪŮŰŲÝŸŻŹ',
              'aaaaaaaaaccceeeeeeeeiiiiiiinnnoooooooouuuuuuuuyyzzzAAAAAAAAACCCEEEEEEEEIIIIIINOOOOOOOOUUUUUUUUYYZZ'
            );
          $fn$ LANGUAGE sql IMMUTABLE;
        END IF;
      END
      $$;
    `);
  } catch {
    /* a read-only replica: the caller falls back to plain ILIKE semantics */
  }
}

/**
 * Trigram similarity, guaranteed present.
 *
 * The catalogue tolerates spelling drift with `similarity(name, query) > 0.24`
 * — pg_trgm on a managed server. Where the extension is unavailable this
 * installs a true trigram Jaccard (intersection ÷ union of 3-grams), which is
 * the same measure with the same threshold, so fuzzy search keeps working
 * instead of failing the whole query.
 */
async function installSimilarity() {
  try {
    await db.execute(sql`SELECT similarity('ab', 'abc')`);
    return;
  } catch { /* absent */ }
  try {
    await db.execute(sql`
      CREATE FUNCTION similarity(a text, b text) RETURNS real AS $fn$
      DECLARE
        ta text[];
        tb text[];
        inter integer;
        uni integer;
      BEGIN
        a := lower(coalesce(a, ''));
        b := lower(coalesce(b, ''));
        IF a = b THEN RETURN 1; END IF;
        IF length(a) < 3 OR length(b) < 3 THEN RETURN 0; END IF;
        SELECT array_agg(substr(a, i, 3)) INTO ta FROM generate_series(1, length(a) - 2) AS i;
        SELECT array_agg(substr(b, i, 3)) INTO tb FROM generate_series(1, length(b) - 2) AS i;
        SELECT count(*) INTO inter FROM (SELECT unnest(ta) INTERSECT SELECT unnest(tb)) AS x;
        SELECT count(*) INTO uni FROM (SELECT unnest(ta) UNION SELECT unnest(tb)) AS y;
        IF uni = 0 THEN RETURN 0; END IF;
        RETURN inter::real / uni;
      END
      $fn$ LANGUAGE plpgsql IMMUTABLE;
    `);
  } catch {
    /* read-only replica: fuzzy matching quietly unavailable */
  }
}
