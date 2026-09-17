"use client";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCopy } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toaster";
import { formatDT } from "@/lib/money";
import { createSubscriptionAction, searchCatalogAction, setSubscriptionFrequencyAction, setSubscriptionStatusAction, skipNextDeliveryAction, swapSubscriptionItemAction } from "@/actions/experience";

export type SubItem = { id: number; productId: number; name: string; brandName: string | null; image: string | null; priceMillimes: number };
export type SubData = { id: number; status: "active" | "paused" | "cancelled"; frequencyDays: number; nextDueAt: string; items: SubItem[]; totalEstimate: number };

export function SubscriptionManager({ subs }: { subs: SubData[] }) {
  const copy = useCopy();
  const t = copy.subscription;
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
    <ul className="space-y-4">
      {subs.map((s) => (
        <li key={s.id} className={`border p-6 ${s.status === "cancelled" ? "border-line bg-bg-2 opacity-60" : s.status === "paused" ? "border-warning bg-warning-soft" : "border-ink bg-bg"}`}>
          <div className="flex justify-between">
            <p className="font-sans text-[18px] font-semibold">{t.every.replace("{n}", String(s.frequencyDays))}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] border border-line px-2 py-1">{t.status[s.status]}</p>
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-muted">{t.nextDelivery}: {new Date(s.nextDueAt).toLocaleDateString("fr-FR")} · {t.totalEstimate}: {formatDT(s.totalEstimate)}</p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {s.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <span className="relative h-10 w-8 bg-bg-2 border border-line">{it.image && <Image src={it.image} alt="" fill className="object-cover" />}</span>
                <span className="flex-1 truncate font-sans text-[13px]">{it.name}</span>
                <span className="font-mono text-[12px]">{formatDT(it.priceMillimes)}</span>
                {s.status !== "cancelled" && <button onClick={() => setSwapping((w) => (w && w.subId === s.id && w.fromProductId === it.productId ? null : { subId: s.id, fromProductId: it.productId }))} className="h-8 w-8 border border-line font-mono text-[11px]">⇄</button>}
              </li>
            ))}
          </ul>
          {swapping?.subId === s.id && <SwapPicker onPick={async (pid) => { const item = s.items.find((x) => x.productId === swapping.fromProductId); await act(() => swapSubscriptionItemAction(s.id, item?.productId ?? 0, pid), t.swapDone); setSwapping(null); }} />}
          {s.status !== "cancelled" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={pending} onClick={() => act(() => setSubscriptionStatusAction(s.id, s.status === "paused" ? "active" : "paused"))} className="btn-ghost">{s.status === "paused" ? t.resume : t.pause}</button>
              <button disabled={pending} onClick={() => act(() => skipNextDeliveryAction(s.id), t.skippedMsg)} className="btn-ghost">{t.skip}</button>
              <select defaultValue={s.frequencyDays} onChange={(e) => act(() => setSubscriptionFrequencyAction(s.id, Number(e.target.value)), t.freqDone)} className="field-swiss h-9 w-auto"><option value={21}>21 j</option><option value={30}>30 j</option><option value={45}>45 j</option><option value={60}>60 j</option><option value={90}>90 j</option></select>
              <button disabled={pending} onClick={() => act(() => setSubscriptionStatusAction(s.id, "cancelled"), t.cancelled)} className="btn-ghost text-error ml-auto">{t.cancel}</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function SwapPicker({ onPick }: { onPick: (productId: number) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const timer = useRef<any>(null);
  return (
    <div className="mt-3 border border-ink bg-bg p-3">
      <input value={q} onChange={(e) => { setQ(e.target.value); if (timer.current) clearTimeout(timer.current); if (e.target.value.trim().length < 2) return setRows([]); timer.current = setTimeout(async () => { const r = await searchCatalogAction(e.target.value); if (r.ok) setRows(r.data); }, 280); }} placeholder="Chercher…" className="field-swiss" autoFocus />
      {rows.length > 0 && <ul className="mt-2 max-h-48 overflow-auto border border-line">{rows.map((p) => <li key={p.id}><button onClick={() => onPick(p.id)} className="w-full text-left p-2 hover:bg-bg-2 font-sans text-[12px]">{p.name}</button></li>)}</ul>}
    </div>
  );
}

export function SubscribeComposer({ suggestions }: { suggestions: { id: number; name: string; brandName: string | null; image: string | null; priceMillimes: number }[] }) {
  const copy = useCopy();
  const t = copy.subscription;
  const { toast } = useToast();
  const router = useRouter();
  const [picked, setPicked] = useState<number[]>([]);
  const [freq, setFreq] = useState(30);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const timer = useRef<any>(null);
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 8 ? [...p, id] : p));

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{t.startCta}</p>
      {suggestions.length > 0 && (
        <div className="mt-4 grid gap-px bg-line border border-line sm:grid-cols-2">
          {suggestions.map((s) => {
            const on = picked.includes(s.id);
            return <button key={s.id} onClick={() => toggle(s.id)} className={`text-left p-4 ${on ? "bg-ink text-paper" : "bg-bg hover:bg-bg-2"}`}><span className="font-sans text-[13px]">{s.name}</span><span className="block font-mono text-[10px] opacity-60">{s.brandName}</span></button>;
          })}
        </div>
      )}
      <input value={q} onChange={(e) => { setQ(e.target.value); if (timer.current) clearTimeout(timer.current); if (e.target.value.trim().length < 2) return setRows([]); timer.current = setTimeout(async () => { const r = await searchCatalogAction(e.target.value); if (r.ok) setRows(r.data); }, 280); }} placeholder="Rechercher un produit…" className="field-swiss mt-4" />
      {rows.length > 0 && <div className="mt-2 border border-line max-h-48 overflow-auto">{rows.map((p) => <button key={p.id} onClick={() => { toggle(p.id); setQ(""); setRows([]); }} className="w-full text-left p-2 border-b border-line hover:bg-bg-2 font-sans text-[12px]">{p.name}</button>)}</div>}
      <div className="mt-6 flex items-center gap-3">
        <select value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="field-swiss w-24"><option value={21}>21 j</option><option value={30}>30 j</option><option value={45}>45 j</option><option value={60}>60 j</option><option value={90}>90 j</option></select>
        <button disabled={pending || picked.length === 0} onClick={() => start(async () => { const r = await createSubscriptionAction({ productIds: picked, frequencyDays: freq }); if (r.ok) { toast({ kind: "success", title: t.created.replace("{n}", String(freq)) }); router.refresh(); } else toast({ kind: "error", title: r.error ?? "" }); })} className="btn-primary ml-auto">Créer</button>
      </div>
    </div>
  );
}
