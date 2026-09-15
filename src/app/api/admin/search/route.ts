import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth";
import { ensureSearchSql } from "@/db/functions";
import { globalSearch } from "@/lib/admin/detail";

export const dynamic = "force-dynamic";

/**
 * Admin-wide search.
 *
 * Same domain search the operator gets in the command palette, exposed so the
 * palette can search without shipping the catalogue to the browser. Staff
 * only: this surface sees uncollected revenue, customers and stock levels.
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ hits: [] });
  await ensureSearchSql();
  try {
    const hits = await globalSearch(q, 5);
    return NextResponse.json({ hits });
  } catch (error) {
    return NextResponse.json({ hits: [], error: error instanceof Error ? error.message : "search failed" }, { status: 500 });
  }
}
