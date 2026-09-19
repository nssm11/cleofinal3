import { NextResponse } from "next/server";
import { addonImplementationStats, addonImplementations, addonsByBatch } from "@/lib/addon-implementation";
import { excludedEnhancements } from "@/lib/enhancement-batches";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    stats: addonImplementationStats,
    exclusions: excludedEnhancements,
    items: addonImplementations,
    batches: addonsByBatch(),
  });
}
