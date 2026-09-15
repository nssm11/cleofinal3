import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AccountHeader, OrderRow } from "@/components/account/account-ui";
import { Reveal } from "@/components/motion/reveal";
import { PackageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes commandes" };

/**
 * LE REGISTRE — the full ledger, one card per order. Same bones as the
 * overview's three, but without limit: every order, newest first.
 */
export default async function CommandesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/commandes");
  const list = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });

  return (
    <div>
      <AccountHeader
        index="02"
        eyebrow="Le registre"
        title="Mes commandes"
        description={
          list.length
            ? `${list.length} commande${list.length > 1 ? "s" : ""} — de la plus récente à la plus ancienne.`
            : "Chaque commande apparaîtra ici, avec son suivi et sa facture."
        }
      />

      {list.length === 0 ? (
        <Reveal y={10} className="mt-8">
          <div className="rounded-[3px] border border-dashed border-stone-2/70 bg-cream/50 px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stone-2/60 text-champagne-2">
              <PackageIcon size={20} />
            </span>
            <p className="mt-6 font-display text-display-sm text-ink">Aucune commande pour l&apos;instant</p>
            <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
              Quand votre premier colis sera prêt à partir, sa route apparaîtra ici — étape par étape.
            </p>
            <Link href="/boutique" className="btn-secondary mt-8">
              Découvrir la boutique
            </Link>
          </div>
        </Reveal>
      ) : (
        <ul className="mt-8 space-y-4">
          {list.map((o, i) => (
            <Reveal as="li" key={o.id} y={14} delay={Math.min(i * 0.05, 0.3)} amount={0.05}>
              <OrderRow
                number={o.number}
                date={o.createdAt}
                total={o.totalMillimes}
                status={o.status}
                items={o.items.map((it) => ({ id: it.id, image: it.image, name: it.name, quantity: it.quantity }))}
              />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
