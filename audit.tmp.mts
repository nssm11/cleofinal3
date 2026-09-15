import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./data/pglite");
const q = async (label: string, sql: string) => {
  try { const r = await db.query(sql); console.log(label, JSON.stringify(r.rows)); } catch (e) { console.log(label, "ERR", (e as Error).message); }
};
await q("counts", `select (select count(*) from orders) orders, (select count(*) from order_items) items, (select count(*) from inventory_movements) moves, (select count(*) from reviews) reviews, (select count(*) from search_events) searches, (select count(*) from analytics_events) analytics, (select count(*) from audit_logs) audit, (select count(*) from email_outbox) outbox, (select count(*) from support_tickets) tickets, (select count(*) from return_requests) returns, (select count(*) from loyalty_transactions) loyalty, (select count(*) from admin_tasks) tasks, (select count(*) from automations) autos, (select count(*) from users) users, (select count(*) from wishlist_items) wishes`);
await q("status", `select status, count(*), sum(total_millimes)/1000 rev from orders group by 1 order by 2 desc`);
await q("pay", `select payment_status, count(*) from orders group by 1`);
await q("revenue_30", `select sum(total_millimes)/1000 rev, count(*) n from orders where created_at > now() - interval '30 days' and status <> 'cancelled'`);
await q("revenue_prev30", `select sum(total_millimes)/1000 rev, count(*) n from orders where created_at between now() - interval '60 days' and now() - interval '30 days' and status <> 'cancelled'`);
await q("lowstock", `select count(*) filter (where stock = 0) oos, count(*) filter (where stock>0 and stock<=low_stock_threshold) low, count(*) filter (where stock > low_stock_threshold*6) overstock, sum(stock) total from products where status='active'`);
await q("ledger_check", `select p.id, p.stock, (select max(stock_after) from inventory_movements m where m.product_id=p.id) ledger, (select sum(quantity) from inventory_movements m where m.product_id=p.id) net from products p limit 5`);
await q("search_top", `select query, count(*) n, count(*) filter (where results_count=0) zero from search_events group by 1 order by n desc limit 6`);
await q("wish_gap", `select p.name, count(w.user_id) wishes, p.sales_count sold from wishlist_items w join products p on p.id=w.product_id group by 1,3 order by 2 desc limit 6`);
await q("audit_actions", `select action, count(*) from audit_logs group by 1 order by 2 desc limit 6`);
await q("outbox", `select kind, status, count(*) from email_outbox group by 1,2 order by 3 desc limit 6`);
await q("rfm_users", `select count(*) customers, count(*) filter (where orders>0) buyers from (select u.id, (select count(*) from orders o where o.user_id=u.id) orders from users u where u.role='customer') t`);
await q("cohort", `select date_trunc('month', created_at)::date m, sum(total_millimes)/1000 rev, count(*) n from orders where status<>'cancelled' group by 1 order by 1`);
await q("bought_together", `select a.product_id p1, b.product_id p2, count(*) n from order_items a join order_items b on a.order_id=b.order_id and a.product_id<b.product_id group by 1,2 order by 3 desc limit 5`);
await db.close();
