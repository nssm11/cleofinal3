import "dotenv/config";
import { listActives, productIdsForActive } from "../src/lib/actives";
const a = await listActives();
console.log("actives:", a.length, a.slice(0, 6).map((x) => `${x.label}:${x.n}`).join(", "));
console.log("niacinamide ids:", await productIdsForActive("niacinamide"));
console.log("panthenol ids:", await productIdsForActive("panthenol"));
