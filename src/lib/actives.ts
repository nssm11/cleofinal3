import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ACTIVES, ALIASES, activeBySlug, canonise, fold, type ActiveCount } from "./actives-dictionary";

/**
 * LES ACTIFS AU COMPTOIR — the dictionary joined to the shelf.
 *
 * The words live in ./actives-dictionary.ts; this file is the only place the
 * database is asked about them. Two questions: which actifs are on the
 * shelves and in what number, and which products carry a given actif.
 */

export { ACTIVE_FAMILIES, canonise, activeBySlug } from "./actives-dictionary";
export type { Active, ActiveCount, Family } from "./actives-dictionary";

/** The same folding as fold(), done by PostgreSQL, so both sides match. */
const ACC = "àáâäãåçéèêëíìîïñóòôöõúùûüý";
const REP = "aaaaaac" + "eeee" + "iiii" + "n" + "ooooo" + "uuuu" + "y";
const folded = (column: string) =>
  sql.raw(`translate(lower(btrim(${column})), '${ACC}', '${REP}')`);

/** Every active present on the shelf, with its real reference count. */
export async function listActives(): Promise<ActiveCount[]> {
  const res = await db.execute(sql`
    select a.active, count(distinct p.id)::int as n
    from ${products} p, jsonb_array_elements_text(coalesce(p.key_actives, '[]'::jsonb)) a(active)
    where p.status = 'active'
    group by 1
  `);
  const rows = (res as unknown as { rows: { active: string; n: number }[] }).rows ?? [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const canon = canonise(row.active);
    if (!canon) continue;
    counts.set(canon.slug, (counts.get(canon.slug) ?? 0) + Number(row.n));
  }
  return ACTIVES.filter((a) => counts.has(a.slug))
    .map((a) => ({ ...a, n: counts.get(a.slug) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "fr"));
}

/**
 * The ids of the products carrying an active — matched on any of its
 * spellings, best-sellers first. Ids only: `getByIds` turns them into real
 * cards, so a glossary page and the shelf never disagree about a price.
 */
export async function productIdsForActive(slug: string): Promise<number[]> {
  if (!activeBySlug(slug)) return [];
  // Folded, because the column says "Niacinamide" and the table says
  // "niacinamide": an accent- and case-blind compare is the whole point.
  const variants = Object.entries(ALIASES)
    .filter(([, s]) => s === slug)
    .map(([variant]) => fold(variant));

  const match = sql.join(
    variants.map((v) => sql`${folded("a.active")} = ${v}`),
    sql` or `,
  );

  const res = await db.execute(sql`
    select p.id
    from ${products} p
    where p.status = 'active'
      and exists (
        select 1 from jsonb_array_elements_text(coalesce(p.key_actives, '[]'::jsonb)) a(active)
        where ${match}
      )
    order by p.sales_count desc, p.name
  `);
  const rows = (res as unknown as { rows: { id: number }[] }).rows ?? [];
  return rows.map((r) => Number(r.id));
}
