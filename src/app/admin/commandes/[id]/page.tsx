import Link from "next/link";
import { notFound } from "next/navigation";
import { orderDetail } from "@/lib/admin/detail";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/order-constants";
import { OrderEventsLive, OrderNotesOs, OrderWorkflow, PaymentControlOs, ResendLetter } from "@/components/admin/os/order-controls";
import { OrderTimeline } from "@/components/admin/os/order-timeline";
import { PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { Glyph } from "@/components/admin/os/icons";
import { KeyValue, Money, OsLink, PaymentTag, Sheet, StatusTag, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * L'ESPACE COMMANDE
 *
 * One order, its whole life: the five doors it walks through, the ledger of
 * events behind them, the articles with their real stock, the customer's
 * context, the letters that left, and the hands that can move it forward.
 */
export default async function OrderWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();
  const o = await orderDetail(id);
  if (!o) notFound();

  const eventAt = (status: string) => o.events.find((e) => e.status === status)?.at?.toISOString() ?? null;
  const ageHours = Math.max(0, (Date.now() - o.createdAt.getTime()) / 3_600_000);
  const late = ageHours > 72 && ["pending", "confirmed", "preparing"].includes(o.status);
  const address = o.address ?? {};
  const missingStock = o.items.filter((i) => i.stock != null && i.stock < i.quantity);

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow={`Commande · ${new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(o.createdAt)}`}
        icon="bag"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="os-num">{o.number}</span>
            <StatusTag status={o.status} />
            <PaymentTag status={o.paymentStatus} />
            {late && <Tag tone="bad">en retard de {Math.round(ageHours)} h</Tag>}
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : address.fullName ?? o.email}</span>
            <span className="text-os-faint">{o.email} · {o.phone}</span>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OsLink href={`/admin/commandes/${o.id}/packing`} variant="ghost" size="md">Liste de préparation</OsLink>
            <OsLink href={`/api/orders/${o.number}/invoice`} variant="ghost" size="md" target="_blank">Facture</OsLink>
            {o.customer && <OsLink href={`/admin/clients/${o.customer.id}`} variant="quiet" size="md">Fiche cliente</OsLink>}
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Total de la commande", value: <Money millimes={o.total} className="text-[1.7rem] text-os-text" />, sub: `${o.items.length} ligne(s) · ${o.items.reduce((a, i) => a + i.quantity, 0)} unité(s)`, tone: "gold" },
          { label: "Âge", value: <><AnimatedNumber value={ageHours} spec={{ kind: "decimal" }} /><span className="ml-1 text-[0.5em] text-os-faint">h</span></>, sub: `dernière écriture ${new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(o.updatedAt)}`, tone: late ? "bad" : "neutral" },
          { label: "Paiement", value: PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod, sub: `${o.paymentStatus === "paid" ? "encaissé" : o.paymentStatus === "refunded" ? "remboursé" : o.paymentStatus === "failed" ? "échec" : "en attente"} · ${SHIPPING_LABELS[o.shippingMethod] ?? o.shippingMethod}`, tone: o.paymentStatus === "paid" ? "good" : o.paymentStatus === "failed" ? "bad" : "warn" },
          { label: "Cliente", value: o.customer ? <AnimatedNumber value={o.customer.orders} /> : "invitée", sub: o.customer ? `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(o.customer.spent / 1000)} DT cumulés · ${o.customer.wishes} envie(s)` : "aucun compte lié", href: o.customer ? `/admin/clients/${o.customer.id}` : undefined },
        ]}
      />

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <Sheet>
            <p className="os-label text-os-faint">Faire avancer</p>
            <h2 className="mt-1 font-display text-[1.35rem] text-os-text">Étape suivante</h2>
            <p className="mt-1 text-[12.5px] text-os-muted">
              Statut actuel : <span className="text-os-text">{ORDER_STATUS_LABELS[o.status]}</span>. Les transitions proposées sont celles que la boutique autorise ; toute annulation ou retour réintègre le stock au registre.
            </p>
            <div className="mt-3">
              <OrderWorkflow orderId={o.id} status={o.status} />
            </div>
          </Sheet>

          <Sheet padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
              <div>
                <p className="os-label text-os-faint">Articles</p>
                <h2 className="mt-1 font-display text-[1.35rem] text-os-text">{o.items.length} ligne(s) · {o.items.reduce((a, i) => a + i.quantity, 0)} unité(s)</h2>
              </div>
              {missingStock.length > 0 && <Tag tone="bad">{missingStock.length} ligne(s) sans stock suffisant</Tag>}
            </div>
            <ul className="divide-y divide-os-line-soft">
              {o.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="os-num grid h-9 w-9 shrink-0 place-items-center border border-os-line bg-os-surface-2 text-[13px] text-os-text">{i.quantity}</span>
                  {i.image && <img src={i.image} alt="" className="h-10 w-10 shrink-0 object-cover" loading="lazy" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-os-text">{i.name}</p>
                    <p className="truncate text-[11px] text-os-faint">
                      {i.brandName} · {i.sku}
                      {i.productId ? (
                        <>
                          {" · "}
                          <Link href={`/admin/produits/${i.productId}`} className="text-os-gold hover:underline">ouvrir la fiche</Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5">
                    {i.stock != null && (
                      <span className={cn("os-num text-[11.5px]", i.stock < i.quantity ? "text-os-crit" : i.stock === 0 ? "text-os-crit" : "text-os-muted")}>
                        stock {i.stock}
                      </span>
                    )}
                    <span className="os-num w-16 text-right text-[11.5px] text-os-muted">{new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 }).format(i.unitPrice / 1000)}</span>
                    <Money millimes={i.lineTotal} className="w-24 text-right text-[13px] text-os-text" />
                  </div>
                </li>
              ))}
            </ul>
            <dl className="grid gap-1.5 border-t border-os-line px-4 py-3 text-[12.5px] sm:grid-cols-2">
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Sous-total</dt><dd className="os-num text-os-text"><Money millimes={o.subtotal} /></dd></div>
              {o.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-os-muted">Remise {o.promoCode ? `(${o.promoCode})` : ""}</dt><dd className="os-num text-os-gold-2">− <Money millimes={o.discount} /></dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-os-muted">Livraison</dt><dd className="os-num text-os-text"><Money millimes={o.shipping} /></dd></div>
              {o.giftWrap > 0 && <div className="flex justify-between gap-3"><dt className="text-os-muted">Emballage cadeau</dt><dd className="os-num text-os-text"><Money millimes={o.giftWrap} /></dd></div>}
              <div className="flex justify-between gap-3 border-t border-os-line-soft pt-1.5"><dt className="font-semibold text-os-text">Total</dt><dd className="os-num font-display text-[1.15rem] text-os-text"><Money millimes={o.total} /></dd></div>
            </dl>
          </Sheet>

          <div className="grid gap-3 lg:grid-cols-2">
            <Sheet>
              <p className="os-label text-os-faint">Adresse de livraison</p>
              <div className="mt-2 text-[12.5px] leading-relaxed text-os-text">
                {address.fullName && <p>{address.fullName}</p>}
                {address.line1 && <p>{address.line1}</p>}
                {address.line2 && <p>{address.line2}</p>}
                <p>{[address.postalCode, address.city].filter(Boolean).join(" ")}</p>
                {address.governorate && <p>{address.governorate}</p>}
                {!address.line1 && <p className="text-os-muted">Aucune adresse structurée pour cette commande.</p>}
              </div>
              {(o.giftMessage || o.customerNote) && (
                <div className="mt-3 space-y-2 border-t border-os-line-soft pt-2 text-[12.5px]">
                  {o.giftMessage && <p><span className="os-label text-os-faint">Message cadeau</span> <br />{o.giftMessage}</p>}
                  {o.customerNote && <p><span className="os-label text-os-faint">Note de la cliente</span> <br />{o.customerNote}</p>}
                </div>
              )}
            </Sheet>
            <Sheet>
              <p className="os-label text-os-faint">Contexte cliente</p>
              {o.customer ? (
                <>
                  <KeyValue
                    className="mt-2"
                    dense
                    items={[
                      { label: "Compte créé le", value: new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short", year: "numeric" }).format(o.customer.createdAt) },
                      { label: "Commandes", value: o.customer.orders },
                      { label: "Total dépensé", value: <Money millimes={o.customer.spent} /> },
                      { label: "Points fidélité", value: o.customer.loyaltyPoints },
                      { label: "Retours", value: o.customer.returns },
                      { label: "Liste d'envie", value: `${o.customer.wishes} produit(s)` },
                    ]}
                  />
                  {o.siblings.length > 0 && (
                    <div className="mt-3 border-t border-os-line-soft pt-2">
                      <p className="os-label text-os-faint">Autres commandes</p>
                      <ul className="mt-1 space-y-1">
                        {o.siblings.slice(0, 5).map((s) => (
                          <li key={s.id} className="flex items-center justify-between gap-3 text-[12px]">
                            <Link href={`/admin/commandes/${s.id}`} className="os-num text-os-gold hover:underline">{s.number}</Link>
                            <span className="os-num text-os-muted">{new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", year: "2-digit" }).format(s.at)}</span>
                            <span className="os-num text-os-text"><Money millimes={s.total} /></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-[12.5px] text-os-muted">
                  Commande passée sans compte. Les coordonnées sont conservées sur la commande — la cliente n&apos;a pas d&apos;historique à consulter.
                </p>
              )}
            </Sheet>
          </div>

          {(o.returns.length > 0 || o.tickets.length > 0 || o.tasks.length > 0) && (
            <div className="grid gap-3 lg:grid-cols-3">
              {o.returns.length > 0 && (
                <Panel eyebrow="Retours" title={`${o.returns.length} demande(s)`} sub="Suivi dans le support">
                  <ul className="space-y-1.5">
                    {o.returns.map((r) => (
                      <li key={r.id} className="text-[12.5px]">
                        <span className="os-num text-os-text">{r.number}</span> <span className="text-os-muted">· {r.reason}</span>
                        <Tag tone={r.status === "pending" ? "warn" : "neutral"} className="ml-2">{r.status}</Tag>
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/support" className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir le support</Link>
                </Panel>
              )}
              {o.tickets.length > 0 && (
                <Panel eyebrow="Support" title={`${o.tickets.length} message(s)`} sub="Rattachés au numéro de commande">
                  <ul className="space-y-1.5">
                    {o.tickets.map((t) => (
                      <li key={t.id} className="text-[12.5px] text-os-text">
                        {t.subject} <Tag tone={t.priority === "urgent" ? "bad" : "neutral"} className="ml-1">{t.status}</Tag>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              {o.tasks.length > 0 && (
                <Panel eyebrow="Tâches" title={`${o.tasks.length} ouverte(s)`} sub="File de travail de l'équipe">
                  <ul className="space-y-1.5">
                    {o.tasks.map((t) => (
                      <li key={t.id} className="text-[12.5px] text-os-text">
                        {t.title} {t.assignee && <span className="text-os-muted">· {t.assignee}</span>}
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/taches" className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-os-gold">Ouvrir la file</Link>
                </Panel>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne contextuelle ─────────────────────────────────────── */}
        <div className="space-y-3">
          <Sheet>
            <p className="os-label text-os-faint">Chronologie</p>
            <h2 className="mt-1 font-display text-[1.35rem] text-os-text">Le parcours de cette commande</h2>
            <ul className="mt-3 space-y-1.5">
              <OrderEventsLive orderId={o.id} initialCount={o.events.length} />
            </ul>
            <div className="mt-3">
              <OrderTimeline
                status={o.status}
                events={o.events.map((e) => ({ id: e.id, status: e.status, message: e.message, at: e.at.toISOString(), actor: e.actor }))}
                createdAt={o.createdAt.toISOString()}
                paidAt={o.paymentStatus === "paid" ? eventAt("confirmed") ?? o.updatedAt.toISOString() : null}
                shippedAt={eventAt("shipped")}
                deliveredAt={eventAt("delivered")}
              />
            </div>
          </Sheet>

          <Sheet>
            <p className="os-label text-os-faint">Paiement</p>
            <div className="mt-2">
              <PaymentControlOs orderId={o.id} method={o.paymentMethod} status={o.paymentStatus} total={o.total} />
            </div>
          </Sheet>

          <Sheet>
            <p className="os-label text-os-faint">Notes internes</p>
            <div className="mt-2">
              <OrderNotesOs orderId={o.id} internalNote={o.internalNote} trackingCode={o.trackingCode} />
            </div>
          </Sheet>

          <Panel eyebrow="Lettres" title={`${o.mails.length} envoi(s)`} sub="Chaque lettre peut être renvoyée" padded={false}>
            <ul className="px-4 py-1">
              {o.mails.map((m) => (
                <ResendLetter key={m.id} id={m.id} kind={m.kind} status={m.status} subject={m.subject} to={m.to} at={m.at ? m.at.toISOString() : null} error={m.error} />
              ))}
              {o.mails.length === 0 && <li className="py-3 text-[12.5px] text-os-muted">Aucune lettre n&apos;est rattachée à cette commande.</li>}
            </ul>
          </Panel>

          <Panel eyebrow="Traçabilité" title="Actions enregistrées" sub="Journal d'audit, filtré sur cette commande" padded={false}>
            <ul className="px-4 py-1">
              {o.audits.map((a) => (
                <li key={a.id} className="flex items-start gap-3 border-b border-dashed border-os-line-soft py-2 last:border-0">
                  <Glyph name="stamp" size={13} className="mt-0.5 shrink-0 text-os-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-os-text">{a.action}</span>
                    <span className="block text-[11px] text-os-faint">
                      {new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(a.at)}
                      {a.actor ? ` · ${a.actor}` : " · système"}
                    </span>
                  </span>
                </li>
              ))}
              {o.audits.length === 0 && <li className="py-3 text-[12.5px] text-os-muted">Aucune action administrative tracée sur cette commande.</li>}
            </ul>
            <div className="border-t border-os-line px-4 py-2">
              <Link href="/admin/journal" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Journal complet</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
