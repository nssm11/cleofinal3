import { NextResponse } from "next/server";
import { findAddon } from "@/lib/addon-implementation";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const addon = findAddon((await params).id);
  if (!addon) return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
  return NextResponse.json({ generatedAt: new Date().toISOString(), addon });
}
