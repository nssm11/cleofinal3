import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { giftCardStats, listGiftCards } from "@/lib/gift-cards";
import { AdminPage } from "@/components/admin/ui";
import { GiftCardManager } from "@/components/admin/gift-cards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cartes cadeaux" };

/**
 * THE COUNTER'S MINT — gift cards are stored value, so issuance and
 * cancellation are admin-only. Only the last four characters of a code ever
 * appear here; the full code exists for one glance, at issue.
 */
export default async function AdminGiftCards() {
  if ((await getCurrentUser())?.role !== "admin") redirect("/admin");
  const [cards, stats] = await Promise.all([listGiftCards(), giftCardStats()]);
  return (
    <AdminPage title="Cartes cadeaux" sub={`${cards.length} carte(s) émise(s)`} eyebrow="Commerce · valeur stockée">
      <GiftCardManager cards={cards} stats={stats} />
    </AdminPage>
  );
}
