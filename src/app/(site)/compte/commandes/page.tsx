import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { SectionBrow, LedgerRow } from "@/components/orders/order-cards";
import { EmptyState } from "@/components/feedback/feedback";
import { Reveal } from "@/components/motion/reveal";
import { PackageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes commandes" };

/**
 * LE REGISTRE — the full ledger, one line per order. Same register as the
 * overview's three, without limit: every order, newest first, each opening
 * onto its road and its invoice.
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
      <SectionBrow
        index="03"
        eyebrow="Le registre"
        title={`Mes commandes${list.length ? ` (${list.length})` : ""}`}
      />

      {list.length === 0 ? (
        <Reveal y={10} className="mt-6">
          <div className="border border-dashed border-line-strong/70 bg-mist/50">
            <EmptyState
              icon={<PackageIcon size={20} />}
              title="Aucune commande pour l'instant"
              description="Quand votre premier colis sera prêt à partir, sa route apparaîtra ici — étape par étape."
              action={{ href: "/boutique", label: "Découvrir la boutique" }}
            />
          </div>
        </Reveal>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((o, i) => (
            <Reveal as="li" key={o.id} y={14} delay={Math.min(i * 0.05, 0.3)} amount={0.05} className="list-none">
              <LedgerRow
                number={o.number}
                date={o.createdAt}
                totalMillimes={o.totalMillimes}
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
