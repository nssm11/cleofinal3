import "dotenv/config";
import { asc, gt, and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { products } from "../src/db/schema";
import { pickGapFillers } from "../src/lib/gap";
const pool = await db.select({ id: products.id, name: products.name, priceMillimes: products.priceMillimes, stock: products.stock })
  .from(products).where(and(eq(products.status, "active"), gt(products.stock, 0)))
  .orderBy(asc(products.priceMillimes)).limit(14);
console.log("pool size", pool.length, "| cheapest:", pool.slice(0, 4).map((p) => `${p.name} ${p.priceMillimes / 1000} DT`).join(", "));
for (const remaining of [5_000, 23_400, 60_000, 120_000]) {
  console.log(`reste ${remaining / 1000} DT ->`, pickGapFillers(pool, [], remaining).map((p) => `${p.name} ${p.priceMillimes / 1000}`).join(" · ") || "rien");
}
