import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { AdminPage, Panel } from "@/components/admin/ui";
import { ReviewActions, VerifyReview } from "@/components/admin/inline-actions";
import { StarIcon } from "@/components/icons";
export const dynamic = "force-dynamic";
export default async function AdminReviews() {
  const pending = await db.select({ r: reviews, name: products.name }).from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(eq(reviews.status, "pending")).orderBy(desc(reviews.createdAt));
  /* Approved but unverified: counter reviews waiting for the office's mark —
     the storefront only shows verified ones (P02). */
  const unverified = await db.select({ r: reviews, name: products.name }).from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(and(eq(reviews.status, "approved"), eq(reviews.isVerified, false))).orderBy(desc(reviews.createdAt));
  return (
    <AdminPage title="Modération des avis" sub={`${pending.length} en attente`}>{unverified.length > 0 && <Panel className="mb-6 p-5"><p className="mb-3 text-sm text-admin-muted">{unverified.length} avis publié(s) sans marque de vérification — un achat en boutique ? Marquer vérifié pour le rendre visible.</p><div className="space-y-2">{unverified.map(({ r, name }) => <div key={r.id} className="flex items-center justify-between gap-4 border-t border-admin-stone pt-2 text-sm"><span className="text-admin-muted">{name} · {r.authorName} · {formatDate(r.createdAt)}</span><VerifyReview id={r.id} /></div>)}</div></Panel>}
      {pending.length === 0 ? <p className="text-sm text-admin-muted">Aucun avis à modérer.</p> : <div className="grid gap-4 lg:grid-cols-2">{pending.map(({ r, name }) => <Panel key={r.id} className="p-5"><p className="text-xs text-admin-muted">{name} · {formatDate(r.createdAt)}</p><div className="mt-2 flex items-center gap-1 text-champagne">{Array.from({ length: r.rating }).map((_, i) => <StarIcon key={i} size={12} filled />)}</div>{r.title && <p className="mt-2">{r.title}</p>}<p className="mt-1 text-sm text-admin-muted">{r.body}</p><p className="mt-1 text-xs">{r.authorName}</p><div className="mt-4"><ReviewActions id={r.id} /></div></Panel>)}</div>}
    </AdminPage>
  );
}
