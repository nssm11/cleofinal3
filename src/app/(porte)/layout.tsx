import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured } from "@/lib/catalog";
import { DoorBar } from "@/components/shell/door-bar";
import { CartTray } from "@/components/shell/cart-tray";
import { Concierge } from "@/components/experience/concierge";

/**
 * LE SEUIL — le vestibule des pages privées.
 *
 * The four doors (connexion, inscription, mot de passe oublié, réinitialisation)
 * live outside the shop's chrome on purpose: no mega-nav, no tabs, no footer
 * competing with the register. One strip, one frame, one tray — the same URLs,
 * the same server actions, the same session.
 */
export default async function PorteLayout({ children }: { children: ReactNode }) {
  const [user, upsells] = await Promise.all([getCurrentUser(), getFeatured(6)]);

  return (
    <div className="flex min-h-dvh flex-col bg-porcelain font-body text-slate">
      <DoorBar user={user ? { firstName: user.firstName ?? null } : null} />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <CartTray upsells={upsells} />
      <Concierge />
    </div>
  );
}
