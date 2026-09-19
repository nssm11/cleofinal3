import { NextResponse } from "next/server";
import { productFeed } from "@/lib/catalog-feeds";

export const dynamic = "force-dynamic";

const CHANNELS = new Set(["google", "meta", "tiktok", "availability"]);

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  if (!CHANNELS.has(channel)) return NextResponse.json({ error: "Unknown feed" }, { status: 404 });
  const products = await productFeed();
  return NextResponse.json({ channel, generatedAt: new Date().toISOString(), products });
}
