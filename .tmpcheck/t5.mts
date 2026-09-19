import "dotenv/config";
import { getGapFillers } from "../src/lib/catalog";
import { pickGapFillers } from "../src/lib/gap";
const pool = await getGapFillers(14);
console.log("pool:", pool.map((p) => `${p.name} ${p.priceMillimes / 1000} DT (${p.stock})`).join(" | "));
for (const remaining of [5_000, 23_400, 60_000, 120_000]) {
  console.log(`reste ${remaining / 1000} DT ->`, pickGapFillers(pool, [], remaining).map((p) => `${p.name} ${p.priceMillimes / 1000}`).join(", ") || "rien");
}
