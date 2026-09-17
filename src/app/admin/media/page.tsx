import Link from "next/link";
import { mediaLibrary } from "@/lib/admin/detail";
import { productRows, qualityAudit } from "@/lib/admin/metrics";
import { MediaGrid } from "@/components/admin/os/media-grid";
import { PageHead, StatStrip } from "@/components/admin/os/modules";
import { BarList } from "@/components/admin/os/charts";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { OsLink, Sheet } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Médiathèque" };

/**
 * MÉDIATHÈQUE
 *
 * Not a file manager: a ledger of the images the shop actually points at.
 * Every plate lists where it is used, what it says (its alt text) and whether
 * a file is still reachable at that address. Orphans are shown, not hidden —
 * an unused plate is a decision waiting to be made.
 */
export default async function MediaPage() {
  const [library, list, audit] = await Promise.all([mediaLibrary(), productRows(), qualityAudit()]);
  const noVisual = list.filter((p) => !p.image);
  const poorGallery = list.filter((p) => p.image && (p.images?.length ?? 0) < 2);
  const missingAlt = library.assets.filter((a) => !a.alts.some((t) => t.trim())).length;
  const withText = library.assets.filter((a) => a.alts.some((t) => t.trim())).length;

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Catalogue · visuels"
        icon="image"
        title="Médiathèque"
        sub="Les images que la boutique référence réellement, où elles servent, ce qu'elles disent aux lectrices d'écran, et celles qui ne servent à personne."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OsLink href="/admin/produits/qualite?gravite=critical" variant="ghost" size="md">Fiches sans visuel</OsLink>
            <OsLink href="/admin/produits" variant="quiet" size="md">‹ Catalogue</OsLink>
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Planches référencées", value: <AnimatedNumber value={library.assets.length} />, sub: `${library.sources.length} source(s)`, tone: "neutral" },
          { label: "Orphelines", value: <AnimatedNumber value={library.orphanCandidates} />, sub: "référencées par aucune fiche", tone: library.orphanCandidates ? "warn" : "good" },
          { label: "Sans visuel", value: <AnimatedNumber value={noVisual.length} />, sub: "produits impossibles à montrer", tone: noVisual.length ? "bad" : "good", href: "/admin/produits/qualite?gravite=critical" },
          { label: "Textes alternatifs", value: `${withText}/${library.assets.length}`, sub: `${missingAlt} image(s) sans description`, tone: missingAlt ? "warn" : "good" },
        ]}
      />

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Sheet padded={false} className="p-3 sm:p-4">
          <MediaGrid assets={library.assets} sources={library.sources} />
        </Sheet>

        <div className="space-y-3">
          <Sheet>
            <p className="os-label text-ops-muted">Répartition par source</p>
            <div className="mt-2">
              <BarList rows={library.sources.map((s) => ({ label: s.label, value: s.count }))} format={{ kind: "count" }} />
            </div>
          </Sheet>

          <Sheet padded={false}>
            <div className="border-b border-ops-line px-4 py-3">
              <p className="os-label text-ops-faint">Priorités</p>
              <h2 className="font-ant uppercase text-[1.15rem] tracking-tight text-ops-ink">{noVisual.length + poorGallery.length} fiche(s) à illustrer</h2>
              <p className="text-[11.5px] text-ops-muted">Résolues depuis le catalogue : chaque ligne ouvre l&apos;étape d&apos;édition.</p>
            </div>
            <ul className="max-h-[26rem] divide-y divide-ops-line-soft overflow-y-auto">
              {noVisual.slice(0, 12).map((p) => (
                <li key={`none-${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <Link href={`/admin/produits/${p.id}`} className="block truncate text-[12.5px] text-ops-ink hover:text-ops-signal">{p.name}</Link>
                    <span className="block truncate text-[11px] text-ops-faint">{p.sku} · {p.unitsSold} vendu(s) · stock {p.stock}</span>
                  </span>
                  <Link href={`/admin/produits/${p.id}/edition`} className="shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-ops-signal hover:underline">illustrer</Link>
                </li>
              ))}
              {poorGallery.slice(0, 8).map((p) => (
                <li key={`few-${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <Link href={`/admin/produits/${p.id}`} className="block truncate text-[12.5px] text-ops-ink hover:text-ops-signal">{p.name}</Link>
                    <span className="block truncate text-[11px] text-ops-faint">{p.images.length + 1} planche(s) seulement</span>
                  </span>
                  <Link href={`/admin/produits/${p.id}/edition`} className="shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-ops-signal hover:underline">compléter</Link>
                </li>
              ))}
              {noVisual.length === 0 && poorGallery.length === 0 && (
                <li className="px-4 py-5 text-[12.5px] text-ops-muted">Chaque référence possède un visuel principal et une galerie d&apos;au moins deux planches.</li>
              )}
            </ul>
          </Sheet>

          <Sheet>
            <p className="os-label text-ops-muted">Comment la maison traite les fichiers</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ops-muted">
              Une planche peut servir plusieurs références : la même URL est référencée sans être copiée. Détacher retire le lien, jamais le fichier. Rattacher une planche comme visuel principal conserve l&apos;ancienne dans la galerie — {audit.byKind.find((k) => k.kind === "media")?.n ?? 0} fiche(s) restent sans visuel à cette heure.
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ops-faint">
              Cette médiathèque ne téléverse rien : elle lit le catalogue. Les envois de fichiers, les recadrages et les formats dérivés resteraient à construire — et le dire vaut mieux que d&apos;afficher un bouton qui ne fait rien.
            </p>
          </Sheet>
        </div>
      </section>
    </div>
  );
}
