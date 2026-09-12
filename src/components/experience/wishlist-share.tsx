"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useActionState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, CloseIcon, GiftIcon, LinkIcon, SendIcon, TrashIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toaster";
import { D, EASE_LUXE } from "@/lib/motion";
import { createWishlistShareAction, revokeWishlistShareAction, setWishNoteAction } from "@/actions/experience";

/**
 * The window onto a wishlist. One click mints a private link — it is listed
 * nowhere and revocable instantly — and each product can carry a whispered
 * note (« crème de ma mère ») that travels with it. « Offrir » deep-links into
 * the product page in gift mode.
 */

export type ShareData = { id: number; token: string; label: string; message: string | null; createdAt: string };

export function WishlistSharePanel({ shares, siteUrl }: { shares: ShareData[]; siteUrl: string }) {
  const copy = useCopy();
  const t = copy.favorites;
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [, action, pending2] = useCreateShare();

  return (
    <div className="border border-champagne/35 bg-cream/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-champagne-2">{t.share}</p>
          <p className="max-w-[34rem] text-[13px] leading-relaxed text-muted">{t.shareNote}</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-secondary !min-h-11 px-5">
          {open ? copy.common.close : <><LinkIcon size={13} /> {t.shareCreate}</>}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="overflow-hidden"
          >
            <form action={action} className="grid gap-4 border-t border-stone-2/40 pt-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
              <label className="block">
                <span className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{t.shareLabel}</span>
                <input name="label" maxLength={120} defaultValue={t.title} className="field !min-h-11" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{t.shareMessage}</span>
                <input name="message" maxLength={400} className="field !min-h-11" />
              </label>
              <button disabled={pending2} className="btn-primary !min-h-11 px-6">
                {pending2 ? "…" : t.shareCreate}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {shares.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-stone-2/40 pt-4">
          {shares.map((sh) => {
            const url = `${siteUrl}/liste/${sh.token}`;
            return (
              <li key={sh.id} className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ink">{sh.label}</span>
                  <span dir="ltr" className="mt-0.5 block truncate font-mono text-[10.5px] text-muted-2 ltr:text-left rtl:text-right">{url}</span>
                </span>
                <Link href={`/liste/${sh.token}`} className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink underline decoration-champagne-2 underline-offset-4 hover:text-champagne-2">
                  {t.viewList}
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(url).then(() => toast({ kind: "success", title: copy.common.copied })).catch(() => undefined);
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted hover:text-ink"
                >
                  <CheckIcon size={12} /> {t.shareCopy}
                </button>
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await revokeWishlistShareAction(sh.id); toast({ kind: "success", title: t.revokeDone }); })}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-error"
                >
                  <CloseIcon size={12} /> {t.shareRevoke}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function useCreateShare() {
  const copy = useCopy();
  const { toast } = useToast();
  const router = useRouter();
  return useActionState(async (_p: unknown, form: FormData) => {
    const r = await createWishlistShareAction(null, form);
    if (r.ok) {
      toast({ kind: "success", title: copy.favorites.shared });
      router.refresh();
    }
    return r;
  }, null);
}

/** The per-item note editor, inline on the favorites list. */
export function WishNote({ productId, initial }: { productId: number; initial: string | null }) {
  const copy = useCopy();
  const t = copy.favorites;
  const [editing, setEditing] = useState(!initial);
  const [pending, start] = useTransition();
  const [value, setValue] = useState(initial ?? "");
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink">
        « {initial} » — {copy.common.edit}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => { await setWishNoteAction(productId, value); setEditing(false); });
      }}
      className="flex items-center gap-2"
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} placeholder={t.notePlaceholder} className="field !min-h-9 max-w-[16rem] text-[12.5px]" />
      <button disabled={pending} className="flex h-8 w-8 items-center justify-center text-champagne-2 transition-colors hover:text-ink" aria-label={copy.common.save}>
        <CheckIcon size={14} />
      </button>
    </form>
  );
}

/** « Offrir ce produit » — a gift-deep-link out of the list. */
export function GiftLink({ slug }: { slug: string }) {
  const copy = useCopy();
  return (
    <Link href={`/produit/${slug}?offrir=1`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:text-champagne-2">
      <GiftIcon size={13} /> {copy.favorites.gift}
    </Link>
  );
}
