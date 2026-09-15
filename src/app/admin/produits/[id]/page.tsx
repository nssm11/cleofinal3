import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { productDetail } from "@/lib/admin/detail";
import { productRows, salesVelocity } from "@/lib/admin/metrics";
import { productSignals, stockBook } from "@/lib/admin/insights";
import { ProductCommandOs } from "@/components/admin/os/product-command";
import { PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { AreaChart } from "@/components/admin/os/charts";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, Money, OsLink, Sheet, Tag } from "@/components/admin/os/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const d = new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", year: "2-digit" });
const dt = new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const money0 = new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 });

const MOVEMENT: Record<string, { label: string; tone: "good" | "warn" | "bad" | "neutral" }> = {
  restock: { label: "Réception", tone: "good" },
  sale: { label: "Vente", tone: "neutral" },
  adjust: { label: "Ajustement", tone: "warn" },
  return: { label: "Retour", tone: "warn" },
  damage: { label: "Casse", tone: "bad" },
  reserve: { label: "Réservation", tone: "neutral" },
  release: { label: "Libération", tone: "neutral" },
};

const RELATION_LABEL: Record<string, string> = { pair: "Association", substitute: "Substitut", concern: "Besoin couvert" };

/**
 * FICHE DE COMMANDE PRODUIT
 *
 * The shelf is the argument. This page answers, in one screen: how healthy is
 * the file, how many units are left, how fast they leave, who is waiting for
 * them, what breaks about the sheet, and what the ledger recorded. Editing the
 * sheet itself is one click away and deliberate — the daily work happens here.
 */
export default async function ProductWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "nouveau") redirect("/admin/produits/nouveau/edition");
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [list, velocity, stock, signals] = await Promise.all([
    productRows(),
    salesVelocity(90),
    stockBook(),
    productSignals(400),
  ]);
  const detail = await productDetail(productId, list, velocity);
  if (!detail) notFound();

  const { product, health, velocity: v, movements, sales, recentOrders, reviews, wishlist, restock, relations, bundles, articles, promos } = detail;
  const s = stock.find((x) => x.id === productId);
  const sig = signals.find((x) => x.id === productId);
  const lastSale = product.lastSale ? d.format(product.lastSale) : "jamais vendu";
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const ratingAvg = product.ratingCount ? (product.ratingAvg / 100).toFixed(2) : "—";
  const notif = restock.filter((r) => r.notified).length;
  const perDay = v?.perDay ?? 0;
  const coverDays = perDay > 0 ? product.stock / perDay : null;
  const sold90 = v?.units ?? 0;
  const revenue90 = v?.revenue ?? 0;
  const fmtDate = (x: Date | null) => (x ? d.format(x) : "—");

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        tone="dark"
        eyebrow={`Catalogue · ${product.sku}`}
        icon="cube"
        title={product.name}
        sub={product.shortDescription ?? product.description?.slice(0, 190) ?? "Fiche sans accroche — à compléter."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OsLink href={`/admin/produits/${product.id}/edition`} variant="ghost" size="md">Modifier la fiche</OsLink>
            <OsLink href={`/produit/${product.slug}`} target="_blank" variant="ghost" size="md">Voir en boutique ↗</OsLink>
            <OsLink href={`/admin/produits/qualite?produit=${product.id}`} variant="ghost" size="md">Audit</OsLink>
            <OsLink href="/admin/produits" variant="quiet" size="md">‹ Catalogue</OsLink>
          </div>
        }
        aside={
          <div className="flex items-end gap-4">
            {product.image ? (
              <img src={product.image} alt="" className="h-24 w-24 object-cover" />
            ) : (
              <span className="grid h-24 w-24 place-items-center border border-os-line-strong text-[10px] uppercase tracking-[0.14em] text-os-crit">aucun<br />visuel</span>
            )}
            <div className="text-right">
              <p className="os-label text-os-onink-muted">Prix de vente</p>
              <p className="os-num font-display text-[1.9rem] leading-none text-os-onink">
                {money0.format(product.price / 1000)}<span className="ml-1 text-[0.45em] text-os-onink-muted">DT</span>
              </p>
              {product.compareAt != null && product.compareAt > product.price && (
                <p className="os-num mt-1 text-[11.5px] text-os-gold-2">barré {money0.format(product.compareAt / 1000)} DT</p>
              )}
              <div className="mt-2 flex justify-end gap-1.5">
                {product.status === "active" ? <Tag tone="good">en ligne</Tag> : product.status === "draft" ? <Tag tone="warn">brouillon</Tag> : <Tag tone="neutral">archivé</Tag>}
                {product.isFeatured && <Tag tone="gold">en avant</Tag>}
                {product.isNew && <Tag tone="info">nouveauté</Tag>}
                {product.isCounterPick && <Tag tone="neutral">comptoir</Tag>}
              </div>
            </div>
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Stock", value: <AnimatedNumber value={product.stock} />, sub: s ? `${s.bucket === "rupture" ? "rupture" : s.bucket === "tension" ? "sous seuil" : s.bucket === "surstock" ? "surstock" : "sain"} · seuil ${product.threshold}` : `seuil ${product.threshold}`, tone: product.stock === 0 ? "bad" : product.stock <= product.threshold ? "warn" : "good", href: "/admin/stock" },
          { label: "Couverture", value: coverDays == null ? "—" : `${Math.round(coverDays)} j`, sub: perDay > 0 ? `${perDay.toFixed(3)} unité/jour` : "aucune vente sur 90 jours", tone: coverDays == null ? "neutral" : coverDays < 21 ? "warn" : "neutral" },
          { label: "Vendus · 90 j", value: <AnimatedNumber value={sold90} />, sub: `${money0.format(revenue90 / 1000)} DT · dernière vente ${lastSale}`, tone: sold90 > 0 ? "good" : "neutral" },
          { label: "Envies", value: <AnimatedNumber value={product.wishes} />, sub: sig ? `${sig.wishesNeverBought} jamais converties` : "listes d'envie", tone: product.wishes > 0 ? "gold" : "neutral", href: "/admin/opportunites" },
          { label: "Note", value: ratingAvg, sub: product.ratingCount ? `${product.ratingCount} avis publiés` : "aucun avis", tone: product.ratingAvg >= 450 ? "good" : product.ratingCount ? "warn" : "neutral", href: "/admin/avis" },
          { label: "Santé de la fiche", value: <AnimatedNumber value={health.score} />, sub: `${health.checks.filter((c) => c.ok).length}/${health.checks.length} contrôles`, tone: health.score >= 78 ? "good" : health.score >= 55 ? "warn" : "bad", href: `/admin/produits/qualite?produit=${product.id}` },
        ]}
      />

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0 space-y-3">
          <ProductCommandOs
            id={product.id}
            name={product.name}
            status={product.status}
            isFeatured={product.isFeatured}
            isCounterPick={product.isCounterPick}
            isNew={product.isNew}
            threshold={product.threshold}
            stock={product.stock}
          />

          <Panel
            eyebrow="Douze derniers mois"
            title="Ce que la référence a rapporté, mois par mois"
            sub={`${sales.reduce((a, x) => a + x.units, 0)} unités · ${money0.format(sales.reduce((a, x) => a + x.revenue, 0) / 1000)} DT sur la période`}
          >
            {sales.length > 0 ? (
              <AreaChart
                points={sales.map((x) => ({ at: x.at.toISOString(), value: x.units, label: new Intl.DateTimeFormat("fr-TN", { month: "short" }).format(x.at) }))}
                format={{ kind: "count" }}
                height={168}
                ariaLabel="Unités vendues par mois"
              />
            ) : (
              <EmptyState title="Aucune vente enregistrée" why="Cette référence n'a pas encore été vendue. Vérifiez qu'elle est publiée, visible dans un rayon, et qu'un visuel est présent." />
            )}
          </Panel>

          <Panel eyebrow="Registre" title="Mouvements de stock" sub="Chaque entrée et sortie, telle qu'écrite au journal" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-os-line text-left">
                    {["Date", "Type", "Quantité", "Après", "Motif", "Par", "Commande"].map((h) => (
                      <th key={h} className="os-label whitespace-nowrap px-3 py-2 text-os-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const meta = MOVEMENT[m.type] ?? { label: m.type, tone: "neutral" as const };
                    return (
                      <tr key={m.id} className="border-b border-os-line-soft last:border-0">
                        <td className="os-num whitespace-nowrap px-3 py-2 text-os-muted">{dt.format(m.at)}</td>
                        <td className="px-3 py-2"><Tag tone={meta.tone}>{meta.label}</Tag></td>
                        <td className={cn("os-num px-3 py-2", m.quantity > 0 ? "text-os-ok" : "text-os-crit")}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="os-num px-3 py-2 text-os-text">{m.stockAfter}</td>
                        <td className="max-w-[18rem] truncate px-3 py-2 text-os-muted" title={m.reason ?? ""}>{m.reason ?? "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-os-muted">{m.actor ?? "système"}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {m.orderNumber ? <Link href={`/admin/commandes?q=${m.orderNumber}`} className="os-num text-os-gold hover:underline">{m.orderNumber}</Link> : <span className="text-os-faint">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-5 text-center text-os-muted">Aucun mouvement enregistré : le stock n&apos;a jamais été touché depuis la création de la fiche.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel eyebrow="Commandes" title="Qui l'a achetée" sub={`${recentOrders.length} dernière(s) ligne(s) de commande`} padded={false}>
            <ul className="divide-y divide-os-line-soft">
              {recentOrders.map((o) => (
                <li key={`${o.id}-${o.at.toISOString()}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12.5px]">
                  <Link href={`/admin/commandes/${o.id}`} className="os-num w-24 shrink-0 text-os-gold hover:underline">{o.number}</Link>
                  <span className="min-w-0 flex-1 truncate text-os-text">{o.buyer ?? "commande invitée"}</span>
                  <span className="os-num text-os-muted">× {o.quantity}</span>
                  <Money millimes={o.total} className="os-num w-24 text-right text-os-text" />
                  <span className="os-num w-20 text-right text-os-faint">{fmtDate(o.at)}</span>
                </li>
              ))}
              {recentOrders.length === 0 && <li className="px-4 py-5 text-center text-os-muted">Aucune ligne de commande pour cette référence.</li>}
            </ul>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel eyebrow="Commerce lié" title="Associations, substituts, besoins" padded={false}>
              <ul className="divide-y divide-os-line-soft">
                {relations.map((r) => (
                  <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 px-4 py-2.5">
                    {r.image ? <img src={r.image} alt="" className="h-8 w-8 object-cover" loading="lazy" /> : <span className="grid h-8 w-8 place-items-center bg-os-surface-2 text-os-faint"><Glyph name="tag" size={12} /></span>}
                    <span className="min-w-0 flex-1">
                      {r.kind === "concern" ? (
                        <span className="block truncate text-[12.5px] text-os-text">{r.name}</span>
                      ) : (
                        <Link href={`/admin/produits/${r.id}`} className="block truncate text-[12.5px] text-os-text hover:text-os-gold">{r.name}</Link>
                      )}
                      <span className="block truncate text-[11px] text-os-faint">{RELATION_LABEL[r.kind] ?? r.kind}{r.note ? ` · ${r.note}` : ""}</span>
                    </span>
                  </li>
                ))}
                {bundles.map((b) => (
                  <li key={`duo-${b.id}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="grid h-8 w-8 place-items-center bg-os-gold-soft text-os-gold"><Glyph name="layers" size={12} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-os-text">{b.name}</span>
                      <span className="block truncate text-[11px] text-os-faint">Duo avec {b.other ?? "—"} · remise <Money millimes={b.discount} /></span>
                    </span>
                  </li>
                ))}
                {relations.length === 0 && bundles.length === 0 && (
                  <li className="px-4 py-5 text-[12.5px] text-os-muted">
                    Aucun lien commercial. Depuis <Link href="/admin/mise-en-scene" className="text-os-gold hover:underline">Mise en scène</Link>, on peut l&apos;associer à un duo ou à un substitut.
                  </li>
                )}
              </ul>
            </Panel>

            <Panel eyebrow="Éditorial" title="Où la référence est citée" padded={false}>
              <ul className="divide-y divide-os-line-soft">
                {articles.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
                    <Link href={`/journal/${a.slug}`} target="_blank" className="min-w-0 flex-1 truncate text-os-text hover:text-os-gold">{a.title}</Link>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-os-faint">journal</span>
                  </li>
                ))}
                {promos.map((p) => (
                  <li key={`promo-${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
                    <span className="min-w-0 flex-1 truncate text-os-text"><span className="os-num font-mono text-os-gold-2">{p.code}</span> · {p.label}</span>
                    <Tag tone={p.state === "live" ? "good" : p.state === "expired" ? "bad" : "neutral"}>{p.state === "live" ? "en cours" : p.state === "expired" ? "expiré" : "inactif"}</Tag>
                  </li>
                ))}
                {articles.length === 0 && promos.length === 0 && <li className="px-4 py-5 text-[12.5px] text-os-muted">Ni article de journal, ni promotion ne s&apos;appliquent aujourd&apos;hui à cette référence.</li>}
              </ul>
            </Panel>
          </div>
        </div>

        {/* ── Colonne d'appui ─────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-3">
          <Panel eyebrow="Conformité" title={`Santé ${health.score}/100 — ${health.grade === "excellent" ? "excellente" : health.grade === "good" ? "solide" : health.grade === "fragile" ? "fragile" : "incomplète"}`} sub={`${health.checks.filter((c) => c.ok).length} contrôles satisfaits sur ${health.checks.length}`} padded={false}>
            <ul className="divide-y divide-os-line-soft">
              {health.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2.5 px-4 py-2">
                  <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center border", c.ok ? "border-os-ok bg-os-ok text-os-onink" : "border-os-line-strong bg-os-surface text-os-faint")}>
                    {c.ok ? <Glyph name="check" size={10} /> : <Glyph name="minus" size={10} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] text-os-text">{c.label}</span>
                      <span className="os-num text-[10.5px] text-os-faint">poids {c.weight}</span>
                    </span>
                    <span className={cn("block text-[11px]", c.ok ? "text-os-muted" : "text-os-warn")}>{c.detail}{!c.ok && c.fix ? ` — ${c.fix}` : ""}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Avis clientes" title={pendingReviews.length ? `${pendingReviews.length} avis en attente` : "Tous les avis sont traités"} sub={`${reviews.length} avis affiché(s) depuis la création`} padded={false}>
            <ul className="divide-y divide-os-line-soft">
              {reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="os-num text-[12px] text-os-gold-2">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <Tag tone={r.status === "approved" ? "good" : r.status === "pending" ? "warn" : "bad"}>{r.status === "approved" ? "publié" : r.status === "pending" ? "en attente" : "rejeté"}</Tag>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-os-muted">{r.title ? <span className="text-os-text">{r.title} — </span> : null}{r.body}</p>
                  <p className="mt-0.5 text-[11px] text-os-faint">{r.author}{r.verified ? " · achat vérifié" : ""} · {fmtDate(r.at)}</p>
                </li>
              ))}
              {reviews.length === 0 && <li className="px-4 py-5 text-[12.5px] text-os-muted">Aucun avis sur cette référence. Les avis n&apos;existent que si une cliente en écrit un — rien n&apos;est fabriqué ici.</li>}
            </ul>
            <div className="border-t border-os-line px-4 py-2">
              <Link href="/admin/avis" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Modérer les avis</Link>
            </div>
          </Panel>

          <Panel eyebrow="Attente" title={`${wishlist.length} envie(s) · ${restock.length} alerte(s)`} sub={`${notif} cliente(s) déjà prévenue(s) du retour en stock`} padded={false}>
            <ul className="max-h-72 divide-y divide-os-line-soft overflow-y-auto">
              {wishlist.slice(0, 8).map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]">
                  <Link href={`/admin/clients/${w.id}`} className="min-w-0 flex-1 truncate text-os-text hover:text-os-gold">{w.name}</Link>
                  <span className="text-os-faint">{w.city ?? "—"}</span>
                  <span className="os-num text-os-faint">{fmtDate(w.at)}</span>
                </li>
              ))}
              {restock.filter((r) => !r.notified).slice(0, 6).map((r) => (
                <li key={`restock-${r.id}`} className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]">
                  <span className="min-w-0 flex-1 truncate text-os-muted"><Glyph name="bell" size={11} className="mr-1 inline" />{r.email}</span>
                  <Tag tone="warn">mains levées</Tag>
                  <span className="os-num text-os-faint">{fmtDate(r.at)}</span>
                </li>
              ))}
              {wishlist.length === 0 && restock.length === 0 && <li className="px-4 py-5 text-[12.5px] text-os-muted">Personne n&apos;attend cette référence. Une rupture passerait ici sans bruit — c&apos;est une information en soi.</li>}
            </ul>
          </Panel>

          <Sheet>
            <p className="os-label text-os-muted">Lecture du registre</p>
            <dl className="mt-2 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Volume</dt><dd className="text-os-text">{product.volume ?? "non renseigné"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Laboratoire</dt><dd className="text-os-text">{product.brand ?? "non rattaché"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Classement</dt><dd className="text-os-text">{product.universe ?? "—"} › {product.category ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Lancée le</dt><dd className="os-num text-os-text">{fmtDate(product.launchedAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Créée le</dt><dd className="os-num text-os-text">{fmtDate(product.createdAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Dernière modification</dt><dd className="os-num text-os-text">{fmtDate(product.updatedAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Visuels</dt><dd className="os-num text-os-text">{product.images.length ? `${product.images.length + 1} planche(s)` : product.image ? "1 planche" : "aucune"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Commandes cumulées</dt><dd className="os-num text-os-text">{sig?.orders ?? 0}</dd></div>
            </dl>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
