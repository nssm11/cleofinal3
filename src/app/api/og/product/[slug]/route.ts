import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";
import { eq, and } from "drizzle-orm";
import { formatDT } from "@/lib/money";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db
    .select({ name: products.name, brand: brands.name, price: products.priceMillimes, description: products.shortDescription })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, eq(products.slug, slug)))
    .limit(1);
  if (!p) return new Response("Not found", { status: 404 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#F5F5F7"/>
    <rect x="60" y="60" width="1080" height="510" fill="#fff" stroke="#AAAAAA"/>
    <text x="100" y="145" font-family="Arial" font-size="24" letter-spacing="6" fill="#007AFF">CLÉOPÂTRE</text>
    <text x="100" y="250" font-family="Arial" font-size="72" font-weight="700" fill="#1D1D1F">${esc(p.name)}</text>
    <text x="100" y="315" font-family="Arial" font-size="34" fill="#555">${esc(p.brand ?? "Parapharmacie")}</text>
    <text x="100" y="430" font-family="Arial" font-size="46" fill="#1D1D1F">${esc(formatDT(p.price))}</text>
    <text x="100" y="505" font-family="Arial" font-size="24" fill="#666">${esc(p.description ?? "Produit authentique conseillé au comptoir")}</text>
  </svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
}
