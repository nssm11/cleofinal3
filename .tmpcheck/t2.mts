import "dotenv/config";
import { pulse, ago } from "../src/lib/live";
const p = await pulse();
console.log(JSON.stringify(p, null, 1));
console.log("ago:", p.last ? ago(p.last.minutesAgo) : "-");
