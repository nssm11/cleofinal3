import { readFileSync } from "node:fs";
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const results: { name: string; ok: boolean; ms: number; note: string }[] = [];

async function t(name: string, fn: () => Promise<unknown>) {
  const start = Date.now();
  try {
    const value = await fn();
    const size = Array.isArray(value) ? `${value.length} lignes` : typeof value === "object" && value ? `${Object.keys(value as object).length} clés` : String(value);
    results.push({ name, ok: true, ms: Date.now() - start, note: size });
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - start, note: (error as Error).message.split("\n")[0].slice(0, 150) });
  }
}

const P = { key: "30d", label: "30 jours", from: new Date(Date.now() - 30 * 86_400_000), to: new Date(), days: 30, granularity: "day" } as never;
const metrics = await import("./src/lib/admin/metrics.ts");
const attention = await import("./src/lib/admin/attention.ts");
const insights = await import("./src/lib/admin/insights.ts");
const detail = await import("./src/lib/admin/detail.ts");
const diagnostics = await import("./src/lib/admin/diagnostics.ts");
const automations = await import("./src/lib/admin/automations.ts");
const period = await import("./src/lib/admin/period.ts");
const { ensureSearchSql } = await import("./src/db/functions.ts");
const { previousPeriod, sameperiodLastYear } = period;

await t("ensureSearchSql", () => ensureSearchSql());

const prev = previousPeriod(P);
const year = sameperiodLastYear(P);

await t("period.resolvePeriod", async () => period.resolvePeriod({ p: "30d" }));
await t("period.bucketStarts", async () => period.bucketStarts(P));

await t("pulse.businessPulse", () => metrics.businessPulse(P, prev, year));
await t("pulse.rates", async () => (await metrics.businessPulse(P, prev, year)).rates.confirmation);
await t("metrics.revenueBreakdown universe", () => metrics.revenueBreakdown(P, "universe"));
await t("metrics.revenueBreakdown category", () => metrics.revenueBreakdown(P, "category"));
await t("metrics.revenueBreakdown brand", () => metrics.revenueBreakdown(P, "brand"));
await t("metrics.revenueBreakdown product", () => metrics.revenueBreakdown(P, "product"));
await t("metrics.ordersForProduct", () => metrics.ordersForProduct(P, 1));
await t("metrics.pipeline", () => metrics.pipeline(P));
await t("metrics.paymentMix", () => metrics.paymentMix(P));
await t("metrics.shippingMix", () => metrics.shippingMix(P));
await t("metrics.outstanding", () => metrics.outstanding(P));
await t("metrics.promotionPerformance", () => metrics.promotionPerformance(P));
await t("metrics.promotionsOverview", () => metrics.promotionsOverview());
await t("metrics.productRows", () => metrics.productRows({ limit: 20 }));
await t("metrics.productHealth", async () => { const rows = await metrics.productRows({ limit: 5 }); return rows.map((r: unknown) => metrics.productHealth(r as never)); });
await t("metrics.qualityAudit", () => metrics.qualityAudit());
await t("metrics.inventoryOverview", () => metrics.inventoryOverview());
await t("metrics.salesVelocity", () => metrics.salesVelocity(30));
await t("metrics.inventoryForecast", () => metrics.inventoryForecast(30));
await t("metrics.movements", () => metrics.movements({ limit: 10 }));
await t("metrics.movements typed", () => metrics.movements({ limit: 10, type: "sale" }));
await t("metrics.customerMetrics", () => metrics.customerMetrics());
await t("metrics.rfmSummary", () => metrics.rfmSummary());
await t("metrics.customerLadder", () => metrics.customerLadder());
await t("metrics.searchIntelligence", () => metrics.searchIntelligence(30));
await t("metrics.wishlistIntelligence", () => metrics.wishlistIntelligence());
await t("metrics.boughtTogether", () => metrics.boughtTogether(8));
await t("metrics.categoryPerformance", () => metrics.categoryPerformance(P));
await t("metrics.brandPerformance", () => metrics.brandPerformance(P));
await t("metrics.cartIntelligence", () => metrics.cartIntelligence(P));
await t("metrics.activityFeed", () => metrics.activityFeed({ limit: 10 }));
await t("metrics.activityFeed kinds", () => metrics.activityFeed({ limit: 10, kinds: ["order", "stock"] as never }));
await t("metrics.activityCounts", () => metrics.activityCounts(new Date(Date.now() - 86_400_000), new Date()));
await t("metrics.systemCounts", () => metrics.systemCounts());
await t("metrics.dbLatency", () => metrics.dbLatency());

await t("attention.attentionQueue", () => attention.attentionQueue());
await t("attention.opportunities", () => attention.opportunities());
await t("attention.periodStats", () => attention.periodStats(P));

await t("insights.seriesBundle", () => insights.seriesBundle(P));
await t("insights.seriesBundle hour", () => insights.seriesBundle(period.resolvePeriod({ p: "today" })));
await t("insights.seriesBundle month", () => insights.seriesBundle(period.resolvePeriod({ p: "year" })));
await t("insights.tradingRhythm", () => insights.tradingRhythm(56));
await t("insights.timeline", () => insights.timeline({ from: new Date(Date.now() - 3 * 86_400_000), to: new Date(), limit: 60 }));
await t("insights.timeline filtered", () => insights.timeline({ from: new Date(Date.now() - 7 * 86_400_000), to: new Date(), kinds: ["order", "stock"], limit: 20 }));
await t("insights.timelineCounts", () => insights.timelineCounts(new Date(Date.now() - 86_400_000), new Date()));
await t("insights.cohortRetention", () => insights.cohortRetention(6));
await t("insights.productSignals", () => insights.productSignals(80));
await t("insights.fulfilmentDelays", () => insights.fulfilmentDelays(P));
await t("insights.emailOps", () => insights.emailOps(P));
await t("insights.promoPulse", () => insights.promoPulse(P));
await t("insights.searchPulse", () => insights.searchPulse(30));
await t("insights.automationHealth", () => insights.automationHealth());
await t("insights.contentPulse", () => insights.contentPulse());
await t("insights.diagnosticTrail", () => insights.diagnosticTrail());
await t("insights.dayBook", () => insights.dayBook(new Date()));
await t("insights.stockBook", () => insights.stockBook());

await t("detail.orderDetail", () => detail.orderDetail(1));
await t("detail.customerDetail", () => detail.customerDetail(1));
await t("detail.productDetail", async () => { const list = await metrics.productRows({ limit: 50 }); const v = await metrics.salesVelocity(30); return detail.productDetail(1, list, v); });
await t("detail.mediaLibrary", () => detail.mediaLibrary());
await t("detail.globalSearch avene", () => detail.globalSearch("avene"));
await t("detail.globalSearch CMD", () => detail.globalSearch("CMD"));
await t("detail.evaluateSegment", async () => detail.evaluateSegment(await metrics.customerMetrics(), [{ field: "spent", op: "gt", value: 100 }] as never));

await t("diagnostics.runStoreAudit", () => diagnostics.runStoreAudit());
await t("diagnostics.integrations", () => diagnostics.integrations());
await t("diagnostics.errorCentre", () => diagnostics.errorCentre());
await t("diagnostics.auditTrail", () => diagnostics.auditTrail({ limit: 20 }));
await t("diagnostics.teamOverview", () => diagnostics.teamOverview());
await t("diagnostics.contentOverview", () => diagnostics.contentOverview());
await t("diagnostics.storeSettings", () => diagnostics.storeSettings());

await t("automations.listAutomations", () => automations.listAutomations());
await t("automations.automationRunsFor", () => automations.automationRunsFor(undefined, 10));
await t("automations.evaluate", () => automations.evaluate("stock_out", []));
await t("automations.triggers", async () => automations.AUTOMATION_TRIGGERS.length);

const failed = results.filter((r) => !r.ok);
const slow = [...results].sort((a, b) => b.ms - a.ms).slice(0, 8);
console.log("=== RÉSULTATS");
for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"} ${String(r.ms).padStart(5)} ms  ${r.name.padEnd(34)} ${r.note}`);
console.log("\n=== PLUS LENT");
for (const r of slow) console.log(`${String(r.ms).padStart(5)} ms  ${r.name}`);
console.log(`\n=== ${results.length - failed.length}/${results.length} OK · ${failed.length} en échec`);
process.exit(failed.length ? 1 : 0);
