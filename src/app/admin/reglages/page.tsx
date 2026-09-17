import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { resolvePeriod } from "@/lib/admin/period";
import { emailOps } from "@/lib/admin/insights";
import { Glyph } from "@/components/admin/os/icons";
import { KeyValue, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";

/**
 * RÉGLAGES DE LA MAISON
 *
 * La maison n'a pas un tiroir de commutateurs : ses règles sont écrites dans
 * le code et dans le registre. Cet écran ne promet donc ni curseur ni
 * interrupteur — il dit, par groupe, ce qui est en vigueur, et montre le
 * chemin vers l'écran où chaque règle se vérifie. Aucun secret n'y est affiché.
 */
export default async function Reglages() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const [boutiques, mail] = await Promise.all([
    db.select().from(stores),
    emailOps(resolvePeriod({ p: "30d" })),
  ]);

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-ops-faint">Système · En vigueur</p>
          <h1 className="mt-1.5 font-ant uppercase text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.02] tracking-tight text-ops-ink">Réglages de la maison</h1>
          <p className="mt-1 max-w-[64ch] text-[13px] text-ops-muted">Ce qui est en vigueur, groupe par groupe — lecture seule, car la maison règle sa vie dans le code et dans le registre, pas dans un tableau de commutateurs.</p>
        </div>
        <Tag tone="neutral">Lecture seule</Tag>
      </header>

      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Sheet>
          <SectionHead eyebrow="Monnaie & langue" title="Le cadre" sub="Ce que la maison parle et compte" />
          <div className="mt-3">
            <KeyValue
              dense
              items={[
                { label: "Monnaie", value: "Dinar tunisien (DT)" },
                { label: "Comptage", value: "millimes — 1 DT = 1 000" },
                { label: "Langue de la maison", value: "français · darija · العربية" },
                { label: "Fusion de page", value: "fr-TN" },
              ]}
            />
          </div>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Encaissement" title="Paiement" sub="Les portes par lesquelles l’argent entre" />
          <div className="mt-3">
            <KeyValue
              dense
              items={[
                { label: "À la livraison", value: "encaissé à la remise" },
                { label: "Virement", value: "confirmé à réception" },
                { label: "Carte", value: "refus → retentative / virement" },
                { label: "Carte cadeau", value: "solde déduit au panier" },
              ]}
            />
          </div>
          <Link href="/admin/commandes" className="mt-3 block border-t border-ops-line pt-2.5 text-[11px] uppercase tracking-[0.12em] text-ops-signal">Voir les commandes <Glyph name="arrowRight" size={11} className="inline" /></Link>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Livraison" title="Les chemins" sub="Trousse, express ou en main propre" />
          <div className="mt-3">
            <KeyValue
              dense
              items={[
                { label: "Standard", value: "toutes les gouvernorats" },
                { label: "Express", value: "Tunis et sa région" },
                { label: "En boutique", value: `${boutiques.length} point(s) de vente` },
                { label: "Suivi des colis", value: "17TRACK" },
              ]}
            />
          </div>
          <Link href="/admin/boutiques" className="mt-3 block border-t border-ops-line pt-2.5 text-[11px] uppercase tracking-[0.12em] text-ops-signal">Voir les boutiques <Glyph name="arrowRight" size={11} className="inline" /></Link>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Fidélité" title="Le compte des points" sub="Ce que la maison promet aux clientes" />
          <div className="mt-3">
            <KeyValue
              dense
              items={[
                { label: "Gagné", value: "1 point par DT, à la livraison" },
                { label: "Dépensé", value: "1 000 points = 10 DT en caisse" },
                { label: "Paliers", value: "aucun — un seul compte" },
                { label: "Anniversaire", value: "cérémonie des VIP" },
              ]}
            />
          </div>
          <Link href="/admin/clients" className="mt-3 block border-t border-ops-line pt-2.5 text-[11px] uppercase tracking-[0.12em] text-ops-signal">Voir les clientes <Glyph name="arrowRight" size={11} className="inline" /></Link>
        </Sheet>

        <Sheet>
          <SectionHead eyebrow="Courrier" title="La file d’envoi" sub="Ãtat de la poste, 30 derniers jours" />
          <div className="mt-3">
            <KeyValue
              dense
              items={[
                { label: "Livrées", value: `${mail.sent} lettre(s)` },
                { label: "En attente", value: `${mail.pending} dans la file` },
                { label: "En échec", value: `${mail.failed} à relancer`, hint: mail.failed ? "Les échecs sont repris depuis les opérations e-mail" : undefined },
              ]}
            />
          </div>
          <Link href="/admin/emails" className="mt-3 block border-t border-ops-line pt-2.5 text-[11px] uppercase tracking-[0.12em] text-ops-signal">Voir les opérations e-mail <Glyph name="arrowRight" size={11} className="inline" /></Link>
        </Sheet>

        <Sheet className="border-dashed">
          <SectionHead eyebrow="SÃ©crets" title="Ce que la maison ne montre pas" sub="Ni ici, ni nulle part dans l’interface" />
          <p className="mt-3 max-w-[52ch] text-[12.5px] leading-relaxed text-ops-muted">
            Les mots de passe, les jetons de paiement, les clefs de transporteur et les secrets de base de donnÃ©es vivent hors de l’interface. Un rÃ©glage sensible que la maison n’affiche pas est un rÃ©glage que la maison protÃ¨ge â c’est une rÃ¨gle, pas une omission.
          </p>
          <Link href="/admin/systeme" className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ops-signal">Santé du système <Glyph name="arrowRight" size={11} /></Link>
        </Sheet>
      </section>
    </div>
  );
}
