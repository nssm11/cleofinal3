import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { orders, users } from "../src/db/schema";
import { eq } from "drizzle-orm";
const u = (await db.select({ id: users.id }).from(users).where(eq(users.email, "client@cleopatre.tn")).limit(1))[0];
console.log("client id:", u?.id);
if (u) {
  const res = await db.execute(sql`
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
           coalesce(sum(total_millimes), 0)::bigint as total,
           count(*)::int as n
    from ${orders}
    where user_id = ${u.id}
      and status <> 'cancelled'
      and created_at >= date_trunc('month', now()) - interval '11 months'
    group by 1
    order by 1
  `);
  console.log("rows:", JSON.stringify((res as any).rows));
}
