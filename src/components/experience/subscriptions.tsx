"use client";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PauseIcon, PlayIcon, PlusIcon, RefreshIcon, SkipIcon, SwapIcon, TrashIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toaster";
import { formatDT, formatDTShort } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import { createSubscriptionAction, searchCatalogAction, setSubscriptionFrequencyAction, setSubscriptionStatusAction, skipNextDeliveryAction, swapSubscriptionItemAction } from "@/actions/experience";

/**
 * MON ABONNEMENT — the ledger of quiet recurrence.
 *
 * Each subscription is one hairline card: cadence, content, next date, and the
 * full set of levers — pause, skip, change frequency, swap a reference — each a
 * small text action rather than a heavy button, because flexibility should
 * feel like the house's courtesy, not like paperwork.
 */

export type SubItem = { id: number; productId: number; name: string; brandName: string | null; image: string | null; priceMillimes: number };
export type SubData = {
  id: number;
  status: "active" | "paused" | "cancelled";
  frequencyDays: number;
  nextDueAt: string;
  items: SubItem[];
  totalEstimate: number;
};

export function SubscriptionManager({ subs }: { subs: SubData[] }) {
  const copy = useCopy();
  const t = copy.subscription;
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [swapping, setSwapping] = useState<{ subId: number; fromProductId: number } | null>(null);

  const act = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, okMsg?: string) => {
    start(async () => {
      const r = await fn();
      toast({ kind: r.ok ? "success" : "error", title: r.ok ? okMsg ?? copy.common.saved : r.error ?? copy.common.errorGeneric });
    });
  };

  return (
    <ul className="space-y-6">
      {subs.map((s) => (
        <motion.li
          key={s.id}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: D.base, ease: EASE_LUXE }}
          className={`border p-5 lg:p-6 ${s.status === "cancelled" ? "border-stone-2/40 bg-paper/50 opacity-70" : s.status === "paused" ? "border-warning/40 bg-warning-soft/40" : "border-champagne/40 bg-cream/70"}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="font-display text-[20px] text-ink">
              {t.every.replace("{n}", String(s.frequencyDays))}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${s.status === "active" ? "text-success" : s.status === "paused" ? "text-warning" : "text-muted-2"}`}>
              {t.status[s.status]}
            </p>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            {t.nextDelivery}: <span className="text-charcoal">{new Date(s.nextDueAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            {" · "}
            {t.totalEstimate}: <span className="tabular-nums text-charcoal">{formatDT(s.totalEstimate)}</span> <span className="text-muted-2">(−5 %)</span>
          </p>

          <ul className="mt-4 divide-y divide-stone/70 border-y border-stone/70">
            {s.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3.5 py-3">
                <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-marble">
                  {it.image && <Image src={it.image} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-ink">{it.name}</span>
                  <span className="block text-[11px] text-muted-2">{it.brandName}</span>
                </span>
                <span className="text-[12.5px] tabular-nums text-charcoal">{formatDTShort(it.priceMillimes)}</span>
                {s.status !== "cancelled" && (
                  <button
                    onClick={() => setSwapping((w) => (w && w.subId === s.id && w.fromProductId === it.productId ? null : { subId: s.id, fromProductId: it.productId }))}
                    className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink"
                    aria-label={`${t.swap}: ${it.name}`}
                  >
                    <SwapIcon size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {swapping?.subId === s.id && (
            <SwapPicker
              onPick={async (pid) => {
                const item = s.items.find((x) => x.productId === swapping.fromProductId);
                await act(() => swapSubscriptionItemAction(s.id, item?.productId ?? 0, pid), t.swapDone);
                setSwapping(null);
              }}
            />
          )}

          {s.status !== "cancelled" && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <button disabled={pending} onClick={() => act(() => setSubscriptionStatusAction(s.id, s.status === "paused" ? "active" : "paused"), s.status === "paused" ? copy.common.saved : t.pausedMsg)} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:text-champagne-2 disabled:opacity-40">
                {s.status === "paused" ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
                {s.status === "paused" ? t.resume : t.pause}
              </button>
              <button disabled={pending} onClick={() => act(() => skipNextDeliveryAction(s.id), t.skippedMsg)} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:text-champagne-2 disabled:opacity-40">
                <SkipIcon size={12} /> {t.skip}
              </button>
              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                <RefreshIcon size={12} />
                {t.changeFreq}
                <select
                  defaultValue={s.frequencyDays}
                  onChange={(e) => act(() => setSubscriptionFrequencyAction(s.id, Number(e.target.value)), t.freqDone)}
                  className="border-b border-stone-2/60 bg-transparent py-1 text-[11px] tracking-normal text-charcoal focus:border-champagne focus:outline-none"
                >
                  {[21, 30, 45, 60, 90].map((d, i) => (
                    <option key={d} value={d}>
                      {t.freqOptions[Math.min(i, t.freqOptions.length - 1)]} — {d} {copy.product.subscribeDays}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={pending} onClick={() => act(() => setSubscriptionStatusAction(s.id, "cancelled"), t.cancelled)} className="ms-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-error disabled:opacity-40">
                <TrashIcon size={12} /> {t.cancel}
              </button>
            </div>
          )}
          <p className="mt-3 text-[11.5px] italic text-muted-2">{t.codNote}</p>
        </motion.li>
      ))}
    </ul>
  );
}

function SwapPicker({ onPick }: { onPick: (productId: number) => void }) {
  const copy = useCopy();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<{ id: number; name: string; brandName: string | null; priceMillimes: number; image: string | null }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div className="mt-3 border border-champagne/40 bg-paper/80 p-3">
      <label className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-champagne-2">{copy.subscription.swap}</label>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (timer.current) clearTimeout(timer.current);
          if (e.target.value.trim().length < 2) return setRows([]);
          timer.current = setTimeout(async () => {
            const r = await searchCatalogAction(e.target.value);
            if (r.ok) setRows(r.data.map(({ id, name, brandName, priceMillimes, image }) => ({ id, name, brandName, priceMillimes, image })));
          }, 280);
        }}
        placeholder={copy.ritual.searchPlaceholder}
        className="field mt-2 !min-h-10 text-[13px]"
        autoFocus
      />
      {rows.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-auto">
          {rows.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p.id)} className="flex w-full items-center gap-3 border-b border-stone/60 py-2 text-start last:border-b-0 hover:text-champagne-2">
                <span className="relative h-9 w-7 shrink-0 overflow-hidden bg-marble">
                  {p.image && <Image src={p.image} alt="" fill sizes="28px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] text-ink">{p.name}</span>
                  <span className="block text-[10.5px] text-muted-2">{p.brandName}</span>
                </span>
                <span className="text-[11.5px] tabular-nums text-charcoal">{formatDTShort(p.priceMillimes)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── The composer: pick your staples, fix the cadence ────────────────────── */
export function SubscribeComposer({ suggestions }: { suggestions: { id: number; name: string; brandName: string | null; image: string | null; priceMillimes: number }[] }) {
  const copy = useCopy();
  const t = copy.subscription;
  const { toast } = useToast();
  const router = useRouter();
  const [picked, setPicked] = useState<number[]>([]);
  const [freq, setFreq] = useState(30);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<{ id: number; name: string; brandName: string | null; priceMillimes: number; image: string | null }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 8 ? [...p, id] : p));

  return (
    <div className="border border-stone-2/45 bg-paper/70 p-5 lg:p-6">
      <p className="eyebrow mb-4">{t.startCta}</p>
      {suggestions.length > 0 && (
        <ul className="mb-4 grid gap-px border border-stone-2/25 bg-stone-2/20 sm:grid-cols-2">
          {suggestions.map((s) => {
            const on = picked.includes(s.id);
            return (
              <li key={s.id}>
                <button type="button" onClick={() => toggle(s.id)} aria-pressed={on} className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors ${on ? "bg-champagne-soft/60" : "bg-paper hover:bg-cream"}`}>
                  <span aria-hidden className={`flex h-4 w-4 shrink-0 items-center justify-center border ${on ? "border-champagne-2 bg-champagne-2 text-paper" : "border-stone-2/70"}`}>{on && "✓"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-ink">{s.name}</span>
                    <span className="block text-[10.5px] text-muted-2">{s.brandName}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (timer.current) clearTimeout(timer.current);
          if (e.target.value.trim().length < 2) return setRows([]);
          timer.current = setTimeout(async () => {
            const r = await searchCatalogAction(e.target.value);
            if (r.ok) setRows(r.data);
          }, 280);
        }}
        placeholder={copy.product.subscribeShort + " — " + copy.ritual.searchPlaceholder}
        className="field !min-h-11 text-[13.5px]"
      />
      {rows.length > 0 && (
        <ul className="mt-2 border border-stone-2/40">
          {rows.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { toggle(p.id); setQ(""); setRows([]); }} className="flex w-full items-center gap-3 border-b border-stone/60 px-3 py-2 text-start last:border-b-0 hover:bg-cream">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{p.name}</span>
                <span className="text-[11px] text-muted-2">{formatDTShort(p.priceMillimes)}</span>
                <PlusIcon size={12} className="text-champagne-2" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          {t.every.replace("{n}", String(freq))}
          <select value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="field !min-h-10 w-auto">
            {[21, 30, 45, 60, 90].map((d, i) => (
              <option key={d} value={d}>{t.freqOptions[Math.min(i, t.freqOptions.length - 1)]}</option>
            ))}
          </select>
        </label>
        <button
          disabled={pending || picked.length === 0}
          onClick={() => start(async () => {
            const r = await createSubscriptionAction({ productIds: picked, frequencyDays: freq });
            if (r.ok) {
              toast({ kind: "success", title: t.created.replace("{n}", String(freq)) });
              router.refresh();
            } else toast({ kind: "error", title: r.error ?? copy.common.errorGeneric });
          })}
          className="btn-primary !min-h-11 ms-auto px-6"
        >
          {t.create}
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-muted-2">{t.perks.join(" · ")}</p>
    </div>
  );
}
