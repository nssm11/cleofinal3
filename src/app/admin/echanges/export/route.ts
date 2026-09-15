import { NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryMovements, orders, products, reviews, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * EXPORTS CSV — la sortie de données encadrée.
 *
 * Un seul chemin pour sortir du registre : une route serveur, authentifiée,
 * qui lit la base et livre un CSV. Les chiffres sont ceux du registre,
 * millime par millime ; rien n'est estimé, rien n'est recomposé.
 */

const esc = (v: unknown): string => {
  let s = String(v ?? "");
  if (/^[=+\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const dt = (millimes: number) => (millimes / 1000).toFixed(3).replace(/\.000$/, "");
const date = (d: unknown) => {
  if (d == null) return "";
  const t = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(t.getTime()) ? "" : t.toISOString();
};

/** Postgres rows can reach us as an array or as { rows } through the embedded driver. */
const asRows = (res: unknown): Record<string, unknown>[] =>
  (Array.isArray(res) ? res : ((res as { rows?: Record<string, unknown>[] }).rows ?? [])) as Record<string, unknown>[];

async function csv(headers: string[], rows: unknown[][]): Promise<Response> {
  const body = ["\uFEFF" + headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cleopatre-${new Date().toISOString().slice(0, 10)}-${headers[0]?.toLowerCase().replace(/\s+/g, "-")}.csv"`,
    },
  });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Cette sortie est réservée à l'administration." }, { status: 403 });
  }

  const kind = new URL(req.url).searchParams.get("kind") ?? "orders";

  try {
    if (kind === "orders") {
      const rows = await db
        .select({
          number: orders.number,
          createdAt: orders.createdAt,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          shippingMethod: orders.shippingMethod,
          email: orders.email,
          phone: orders.phone,
          promoCode: orders.promoCode,
          subtotal: orders.subtotalMillimes,
          discount: orders.discountMillimes,
          shipping: orders.shippingMillimes,
          total: orders.totalMillimes,
        })
        .from(orders)
        .orderBy(orders.createdAt);
      return csv(
        ["Numéro", "Date", "Statut", "Paiement", "Méthode", "Livraison", "E-mail", "Téléphone", "Code", "Sous-total DT", "Remise DT", "Livraison DT", "Total DT"],
        rows.map((r) => [r.number, date(r.createdAt), r.status, r.paymentStatus, r.paymentMethod, r.shippingMethod, r.email, r.phone, r.promoCode, dt(r.subtotal), dt(r.discount), dt(r.shipping), dt(r.total)]),
      );
    }

    if (kind === "products") {
      const rows = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          price: products.priceMillimes,
          compareAt: products.compareAtMillimes,
          stock: products.stock,
          threshold: products.lowStockThreshold,
          status: products.status,
          featured: products.isFeatured,
          image: products.image,
        })
        .from(products)
        .orderBy(products.name);
      return csv(
        ["ID", "SKU", "Nom", "Prix DT", "Prix barré DT", "Stock", "Seuil", "Statut", "Mis en avant", "Image"],
        rows.map((r) => [r.id, r.sku, r.name, dt(r.price), r.compareAt ? dt(r.compareAt) : "", r.stock, r.threshold, r.status, r.featured ? "oui" : "non", r.image ?? ""]),
      );
    }

    if (kind === "customers") {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          first: users.firstName,
          last: users.lastName,
          phone: users.phone,
          role: users.role,
          loyalty: users.loyaltyPoints,
          locale: users.locale,
          optIn: users.emailOptIn,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.email);
      return csv(
        ["ID", "E-mail", "Prénom", "Nom", "Téléphone", "Rôle", "Points fidélité", "Langue", "E-mails conseil", "Créée le"],
        rows.map((r) => [r.id, r.email, r.first, r.last, r.phone, r.role, r.loyalty, r.locale, r.optIn ? "oui" : "non", date(r.createdAt)]),
      );
    }

    if (kind === "reviews") {
      const rows = await db.execute(
        `SELECT r.id, p.name AS product, r.author_name, r.rating, r.title, r.status, r.is_verified, r.created_at, r.body
         FROM reviews r LEFT JOIN products p ON p.id = r.product_id
         ORDER BY r.created_at DESC`,
      );
      const list2 = asRows(rows);
      return csv(
        ["ID", "Produit", "Auteur", "Note", "Titre", "Statut", "Vérifié", "Date", "Texte"],
        list2.map((r) => [r.id, r.product ?? "", r.author_name, r.rating, r.title ?? "", r.status, r.is_verified ? "oui" : "non", date(r.created_at), String(r.body ?? "").slice(0, 400)]),
      );
    }

    if (kind === "stock") {
      const rows = await db.execute(
        `SELECT m.id, p.name AS product, m.type, m.quantity, m.stock_after, m.reason, m.created_at
         FROM inventory_movements m LEFT JOIN products p ON p.id = m.product_id
         ORDER BY m.created_at DESC`,
      );
      const list3 = asRows(rows);
      return csv(
        ["ID", "Produit", "Type", "Quantité", "Stock après", "Raison", "Date"],
        list3.map((r) => [r.id, r.product ?? "", r.type, r.quantity, r.stock_after, r.reason ?? "", date(r.created_at)]),
      );
    }

    return NextResponse.json({ error: `Type inconnu : ${kind}` }, { status: 400 });
  } catch (err) {
    console.error("[echanges] export failed:", err);
    return NextResponse.json({ error: "La sortie a échoué. Reessayez." }, { status: 500 });
  }
}
