import { enabledPaymentMethods } from "@/lib/payments";
import { SHIPPING_FEES_PUBLIC } from "@/lib/admin/shipping-constants";
import { OrderWizard } from "@/components/admin/os/order-wizard";
import { PageHead } from "@/components/admin/os/modules";
import { Sheet } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commande manuelle" };

const LABELS: Record<string, string> = {
  cod: "Paiement à la livraison",
  bank_transfer: "Virement bancaire",
  card: "Carte bancaire",
  gift_card: "Carte cadeau",
};

/**
 * COMMANDE MANUELLE
 *
 * For the telephone order, the boutique counter and the Instagram message.
 * Same guarantees as a shopper's checkout: stock locked, movement written,
 * promotion validated, event emitted — in one transaction.
 */
export default function ManualOrderPage() {
  const methods = enabledPaymentMethods().map((m) => ({ key: m, label: LABELS[m] ?? m }));
  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Commerce · saisie assistée"
        icon="plus"
        title="Commande manuelle"
        sub="Sept étapes, une transaction. La disponibilité, le code promotionnel et le stock sont vérifiés au moment de l'écriture — jamais avant, jamais approximativement."
      />
      <OrderWizard paymentMethods={methods} shippingFees={SHIPPING_FEES_PUBLIC} freeShippingThreshold={SHIPPING_FEES_PUBLIC.freeThreshold} />
      <Sheet className="mt-3">
        <p className="os-label text-ops-muted">Ce que la commande déclenche</p>
        <ul className="mt-2 grid gap-1.5 text-[12.5px] text-ops-muted sm:grid-cols-2">
          <li>· Verrouillage des lignes produits (<span className="os-num text-ops-ink">SELECT … FOR UPDATE</span>) pour empêcher toute double vente.</li>
          <li>· Écriture d&apos;un mouvement de stock « vente » par article, avec le stock résultant.</li>
          <li>· Validation du code promotionnel : existence, fenêtre, limite d&apos;usage, panier minimum.</li>
          <li>· Création de la commande, de ses lignes et du premier événement dans la même transaction.</li>
          <li>· Statut de paiement initial selon le moyen choisi (à la livraison = en attente).</li>
          <li>· Rattachement à la cliente si un compte est lié — sinon commande invitée.</li>
        </ul>
      </Sheet>
    </div>
  );
}
