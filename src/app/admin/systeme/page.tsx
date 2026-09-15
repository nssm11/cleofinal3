import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, orders, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { resolvePeriod } from "@/lib/admin/period";
import { dbLatency, qualityAudit, systemCounts } from "@/lib/admin/metrics";
import { emailOps } from "@/lib/admin/insights";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, Money, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * SANTÉ DU SYSTÈME
 *
 * Un diagnostic, pas un tableau de bord : la base répond-elle, la file de
 * lettres s'embouteille-t-elle, quels paiements sont tombés, où sont les
 * fuites du catalogue. Chaque chiffre est mesuré à l'instant de l'ouverture.
 */
export default async function Systeme({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin");
  void (await searchParams);

  const [latency, counts, mail, quality, failedPayments, recentAudit] = await Promise.all([
    dbLatency(),
    systemCounts(),
    emailOps(resolvePeriod({ p: "30d" })),
    qualityAudit(),
    db.select().from(orders).where(eq(orders.paymentStatus, "failed")).orderBy(desc(orders.createdAt)).limit(5),
    db
      .select({ a: auditLogs, actor: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  const registres: [string, number][] = [
    ["Produits", counts.products], ["Commandes", counts.orders], ["Clientes", counts.users], ["Lignes de commande", counts.items],
    ["Avis", counts.reviews], ["Tickets", counts.tickets], ["Mouvements", counts.movements], ["Lettres", counts.emails],
    ["Lettres en échec", counts.emails_failed], ["Recherches", counts.searches], ["Événements", counts.events], ["Audits", counts.audits],
  ];

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-os-faint">Système · Diagnostic</p>
          <h1 className="mt-1.5 font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.02] tracking-tight text-os-text">Santé du système</h1>
          <p className="mt-1 max-w-[64ch] text-[13px] text-os-muted">MesurÃ© Ã  l’instant de l’ouverture de cet Ã©cran â rien n’est en cache, rien n’est inventÃ©.</p>
        </div>
        <Tag tone={latency.ok ? "good" : "bad"}>{latency.ok ? `Base de données · ${latency.ms} ms` : "Base de données en difficulté"}</Tag>
      </header>

      {/* ── Le diagnostic ─────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Sheet>
          <p className="os-label text-os-muted">Réponse de la base</p>
          <p className="os-num mt-1.5 font-display text-[2rem] leading-none text-os-text">{latency.ok ? `${latency.ms} ms` : "—"}</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-os-muted">
            {latency.ok ? "Une lecture simple répond dans les temps. Le registre est joignable." : "La base ne répond pas comme elle devrait. Les écrans peuvent être incomplets."}
            {!latency.ok && latency.error && <span className="mt-1 block font-mono text-[10.5px] text-os-crit">{latency.error}</span>}
          </p>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">File de lettres · 30 jours</p>
          <p className="os-num mt-1.5 font-display text-[2rem] leading-none text-os-text">{mail.pending}</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-os-muted">
            en attente d’envoi Â· <span className={mail.failed ? "text-os-crit" : ""}>{mail.failed} en Ã©chec</span> Â· {mail.sent} livrÃ©e(s)
          </p>
          <Link href="/admin/emails" className="mt-2.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir les opérations e-mail <Glyph name="arrowRight" size={11} /></Link>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">Paiements refusés</p>
          <p className="os-num mt-1.5 font-display text-[2rem] leading-none text-os-text">{failedPayments.length ? "en cours" : "0"}</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-os-muted">
            {failedPayments.length
              ? `${failedPayments.length} commande(s) récente(s) porte une carte refusée — les clientes peuvent payer par virement ou à la livraison.`
              : "Aucune carte refusée dans les cinq dernières commandes échouées."}
          </p>
          <Link href="/admin/attention" className="mt-2.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-os-gold">Centre d’attention <Glyph name="arrowRight" size={11} /></Link>
        </Sheet>

        <Sheet>
          <p className="os-label text-os-muted">Score qualité du catalogue</p>
          <p className="os-num mt-1.5 font-display text-[2rem] leading-none text-os-text">{quality.score}</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-os-muted">{quality.issues.length} point(s) relevé(s) sur {quality.scanned} fiches · {quality.checks} contrôles</p>
          <Link href="/admin/produits/qualite" className="mt-2.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir l’audit <Glyph name="arrowRight" size={11} /></Link>
        </Sheet>
      </section>

      {/* ── Registres & Intégrations ──────────────────────────────────── */}
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Sheet padded={false}>
          <div className="border-b border-os-line px-4 py-3">
            <SectionHead eyebrow="Le registre" title="Ce que la maison compte" sub="Comptés à cet instant, table par table" />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-4 py-3 text-[12.5px] sm:grid-cols-3">
            {registres.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-2 border-b border-dashed border-os-line-soft py-1.5">
                <dt className="text-os-muted">{label}</dt>
                <dd className="os-num text-os-text">{new Intl.NumberFormat("fr-TN").format(value)}</dd>
              </div>
            ))}
          </dl>
        </Sheet>

        <div className="grid content-start gap-3">
          <Sheet>
            <SectionHead eyebrow="Connexions" title="Ce que la maison relie" sub="L’Ã©tat de chaque fil, sans le cacher" />
            <ul className="mt-3 space-y-2.5 text-[12.5px]">
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-os-line-soft pb-2.5">
                <span className="text-os-text">Base de données</span>
                <Tag tone={latency.ok ? "good" : "bad"}>{latency.ok ? "joignable" : "en difficulté"}</Tag>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-os-line-soft pb-2.5">
                <span className="text-os-text">Courrier (file d’envoi)</span>
                <Tag tone={mail.failed > 3 ? "bad" : mail.pending > 10 ? "warn" : "neutral"}>{mail.failed > 3 ? "sous pression" : mail.pending > 10 ? "chargée" : "calme"}</Tag>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-os-line-soft pb-2.5">
                <span className="text-os-text">Encaissement</span>
                <Tag tone="neutral">livraison · virement · carte · carte cadeau</Tag>
              </li>
              <li className="flex items-start justify-between gap-3">
                <span className="text-os-text">Suivi des colis</span>
                <Tag tone="neutral">17TRACK</Tag>
              </li>
            </ul>
            <p className="mt-3 border-t border-os-line pt-3 text-[11.5px] leading-relaxed text-os-faint">
              Aucun secret n’est affichÃ© ici : ni mot de passe, ni jeton, ni adresse de transporteur. Le diagnostic dit l’Ã©tat, jamais le contenu des clefs.
            </p>
          </Sheet>
        </div>
      </section>

      {/* ── Journal ───────────────────────────────────────────────────── */}
      <section className="mt-3">
        <Sheet padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <SectionHead eyebrow="TraÃ§abilitÃ©" title="Les derniers gestes de l’Ã©quipe" sub="Huit actions, dans l’ordre du registre" />
            <Link href="/admin/audit" className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-os-gold">Tout le journal</Link>
          </div>
          {recentAudit.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Journal vierge" why="Aucune action tracÃ©e pour l’instant â le journal se remplit au fil des opÃ©rations." />
            </div>
          ) : (
            <ul className="divide-y divide-os-line-soft">
              {recentAudit.map(({ a, actor }) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[12.5px]">
                  <span className="os-num w-32 shrink-0 text-os-faint">{formatDateTime(a.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-os-text"><span className="font-mono text-[11.5px]">{a.action}</span> · {a.entity} #{a.entityId}</span>
                  <span className="shrink-0 text-os-muted">{actor ?? "système"}</span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </section>
    </div>
  );
}
