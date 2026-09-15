import Link from "next/link";
import { notFound } from "next/navigation";
import { productHealth, productRows, qualityAudit } from "@/lib/admin/metrics";
import { PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { BarList } from "@/components/admin/os/charts";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, OsLink, Sheet, Tag } from "@/components/admin/os/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit qualité du catalogue" };

const SEVERITY: Record<string, { label: string; tone: "bad" | "warn" | "neutral" }> = {
  critical: { label: "Critique", tone: "bad" },
  high: { label: "Élevé", tone: "warn" },
  normal: { label: "Normal", tone: "neutral" },
};

/**
 * AUDIT QUALITÉ DU CATALOGUE
 *
 * The same expectations are applied to every reference — eleven checks each,
 * plus a handful of catalogue-wide ones. The score is the share of those
 * expectations that holds, nothing else. An issue always says what is wrong,
 * on which reference, and where to fix it.
 */
export default async function QualityScanner({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const productFilter = flat.produit ? Number(flat.produit) : null;
  const severityFilter = flat.gravite ?? null;
  const kindFilter = flat.nature ?? null;

  const [audit, list] = await Promise.all([qualityAudit(), productRows()]);
  const focused = productFilter != null ? list.find((p) => p.id === productFilter) ?? null : null;
  if (productFilter != null && !focused) notFound();

  const scoped = focused ? audit.issues.filter((i) => i.productId === focused.id) : audit.issues;
  const issues = scoped
    .filter((i) => !severityFilter || i.severity === severityFilter)
    .filter((i) => !kindFilter || i.kind === kindFilter);
  const health = focused ? productHealth(focused) : null;
  const counts = {
    critical: scoped.filter((i) => i.severity === "critical").length,
    high: scoped.filter((i) => i.severity === "high").length,
    normal: scoped.filter((i) => i.severity === "normal").length,
  };

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Catalogue · conformité"
        icon="beaker"
        title="Audit qualité"
        sub="Onze contrôles par référence, plus les vérifications du catalogue entier : doublons de référence et d'URL, lignes orphelines. Le score est le rapport contrôles tenus / contrôles passés — jamais une note inventée."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OsLink href="/admin/produits" variant="quiet" size="md">‹ Catalogue</OsLink>
            <OsLink href="/admin/systeme" variant="ghost" size="md">Qualité des données</OsLink>
            <OsLink href="/admin/media" variant="ghost" size="md">Médiathèque</OsLink>
          </div>
        }
      />

      {focused && health ? (
        <>
          <Sheet className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="os-label text-os-faint">Examen ciblé</p>
                <h2 className="mt-1 font-display text-[1.4rem] tracking-tight text-os-text">{focused.name}</h2>
                <p className="text-[12px] text-os-muted">{focused.sku} · {focused.brand ?? "sans laboratoire"} · {focused.category ?? "non classé"}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="os-label text-os-faint">Santé de la fiche</p>
                  <p className={cn("os-num font-display text-[1.8rem] leading-none", health.score >= 78 ? "text-os-ok" : health.score >= 55 ? "text-os-warn" : "text-os-crit")}>{health.score}</p>
                </div>
                <OsLink href={`/admin/produits/${focused.id}`} variant="ghost" size="md">Ouvrir la fiche</OsLink>
                <OsLink href={`/admin/produits/${focused.id}/edition`} variant="primary" size="md">Corriger</OsLink>
                <OsLink href="/admin/produits/qualite" variant="quiet" size="md">Quitter l&apos;examen</OsLink>
              </div>
            </div>
            <ul className="mt-3 grid gap-px border border-os-line bg-os-line sm:grid-cols-2 lg:grid-cols-3">
              {health.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 bg-os-surface px-3 py-2">
                  <span className="mt-0.5 text-os-faint">{c.ok ? <Glyph name="check" size={12} className="text-os-ok" /> : <Glyph name="minus" size={12} className="text-os-warn" />}</span>
                  <span>
                    <span className="block text-[12px] text-os-text">{c.label}</span>
                    <span className="block text-[11px] text-os-muted">{c.detail}{!c.ok && c.fix ? ` → ${c.fix}` : ""}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Sheet>

          <StatStrip
            items={[
              { label: "Points sur cette fiche", value: <AnimatedNumber value={scoped.length} />, sub: `sur ${health.checks.length} contrôles`, tone: scoped.length ? "warn" : "good" },
              { label: "Critiques", value: <AnimatedNumber value={counts.critical} />, sub: "empêchent la vente ou l'affichage", tone: counts.critical ? "bad" : "good" },
              { label: "Élevés", value: <AnimatedNumber value={counts.high} />, sub: "dégradent la conversion", tone: counts.high ? "warn" : "good" },
              { label: "Normaux", value: <AnimatedNumber value={counts.normal} />, sub: "finition", tone: "neutral" },
            ]}
          />
        </>
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Score du catalogue", value: <AnimatedNumber value={audit.score} />, sub: `${audit.checks} contrôles passés sur ${audit.scanned} références`, tone: audit.score >= 90 ? "good" : audit.score >= 75 ? "warn" : "bad" },
              { label: "Points critiques", value: <AnimatedNumber value={counts.critical} />, sub: "à traiter avant tout le reste", tone: counts.critical ? "bad" : "good" },
              { label: "Points élevés", value: <AnimatedNumber value={counts.high} />, sub: "conversion et confiance", tone: counts.high ? "warn" : "good" },
              { label: "Références examinées", value: <AnimatedNumber value={audit.scanned} />, sub: "catalogue non archivé", tone: "gold" },
            ]}
          />

          <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Panel eyebrow="Nature des points" title="Où le catalogue pèche" sub="Cliquez une nature pour restreindre la liste">
              <BarList
                rows={audit.byKind.slice(0, 9).map((k) => ({ label: k.label, value: k.n, sub: `gravité ${SEVERITY[k.severity]?.label.toLowerCase() ?? k.severity}`, href: `/admin/produits/qualite?nature=${k.kind}` }))}
                format={{ kind: "count" }}
              />
            </Panel>

            <Panel eyebrow="Lecture" title="Ce que le score mesure" sub="Et ce qu'il ne mesure pas">
              <ul className="space-y-2 text-[12.5px] leading-relaxed text-os-muted">
                <li><span className="text-os-text">Contrôles tenus / contrôles passés.</span> Chaque référence est lue contre les mêmes onze attentes : visuel, galerie, accroche, description, référence, laboratoire, rayon, prix, cohérence du prix barré, visibilité, disponibilité.</li>
                <li><span className="text-os-text">Plus quatre contrôles de catalogue :</span> références en doublon, URL en doublon, lignes de commande orphelines, avis orphelins, listes d&apos;envie orphelines, mouvements orphelins.</li>
                <li><span className="text-os-text">Ce que le score ne dit pas :</span> la qualité des photos, la justesse des descriptions, la pertinence du classement. Ces jugements appartiennent au regard humain, pas à un ratio.</li>
                <li><span className="text-os-text">Aucune note n&apos;est arrondie en faveur de la maison.</span> Un point critique retire autant qu&apos;un point normal ; c&apos;est la gravité qui donne l&apos;ordre de traitement.</li>
              </ul>
            </Panel>
          </section>
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[null, "critical", "high", "normal"].map((sev) => (
          <Link
            key={sev ?? "all"}
            href={sev ? `/admin/produits/qualite?${focused ? `produit=${focused.id}&` : ""}gravite=${sev}` : `/admin/produits/qualite${focused ? `?produit=${focused.id}` : ""}`}
            className={cn("border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors", severityFilter === sev ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line text-os-muted hover:text-os-text")}
          >
            {sev ? `${SEVERITY[sev].label} · ${counts[sev as keyof typeof counts]}` : `Tout · ${scoped.length}`}
          </Link>
        ))}
        {kindFilter && (
          <Link href={`/admin/produits/qualite${focused ? `?produit=${focused.id}` : ""}`} className="flex items-center gap-1.5 border border-os-gold px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-os-gold">
            nature : {kindFilter} <Glyph name="close" size={11} />
          </Link>
        )}
      </div>

      <Sheet className="mt-2" padded={false}>
        <ul className="divide-y divide-os-line-soft">
          {issues.map((i, idx) => {
            const sev = SEVERITY[i.severity] ?? SEVERITY.normal;
            return (
              <li key={`${i.kind}-${i.productId ?? "global"}-${idx}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Tag tone={sev.tone}>{sev.label}</Tag>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] text-os-text">{i.label}</span>
                  <span className="block text-[12px] leading-relaxed text-os-muted">{i.detail}</span>
                </span>
                <Link href={`/admin/produits/qualite?nature=${i.kind}`} className="text-[10.5px] uppercase tracking-[0.12em] text-os-faint hover:text-os-text">{i.kind}</Link>
                {i.productId && <Link href={`/admin/produits/qualite?produit=${i.productId}`} className="text-[10.5px] uppercase tracking-[0.12em] text-os-gold hover:underline">examiner</Link>}
                <Link href={i.productId ? `/admin/produits/${i.productId}/edition` : "/admin/produits"} className="text-[10.5px] uppercase tracking-[0.12em] text-os-gold hover:underline">corriger</Link>
              </li>
            );
          })}
          {issues.length === 0 && (
            <li className="p-4">
              <EmptyState
                title={severityFilter || kindFilter ? "Aucun point pour ce filtre" : "Le catalogue tient ses promesses"}
                why={
                  severityFilter || kindFilter
                    ? "Aucune référence ne présente ce type de point avec la gravité demandée. Retirez le filtre pour voir l'ensemble des points du catalogue."
                    : `Les ${audit.checks} contrôles sont satisfaits sur ${audit.scanned} références : visuels présents, descriptions écrites, rayons renseignés, prix cohérents, aucune ligne orpheline.`
                }
                icon={<Glyph name="check" size={16} />}
              />
            </li>
          )}
        </ul>
      </Sheet>
    </div>
  );
}
