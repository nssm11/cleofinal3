"use client";
import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useCopy } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toaster";
import { formatDT } from "@/lib/money";
import { deleteRitualAction, saveRitualAction, searchCatalogAction } from "@/actions/experience";

export type RitualItem = { productId: number; note?: string; name?: string; brandName?: string | null; image?: string | null; priceMillimes?: number; stock?: number; volume?: string | null };
export type RitualData = { id: number; name: string; moment: "morning" | "evening"; season: string | null; reminderEnabled: boolean; reminderHour: number; reminderDays: number; items: RitualItem[] };

export function Rituals({ initial }: { initial: RitualData[] }) {
  const copy = useCopy();
  const t = copy.ritual;
  const { toast } = useToast();
  const [list, setList] = useState<RitualData[]>(initial);
  const [selected, setSelected] = useState<number | "new">(initial[0]?.id ?? "new");
  const [pending, start] = useTransition();

  const draft = useMemo(() => {
    if (selected === "new") return { id: 0, name: "", moment: "morning" as const, season: "", reminderEnabled: false, reminderHour: 8, reminderDays: 127, items: [] as RitualItem[] };
    const r = list.find((x) => x.id === selected);
    return r ? { id: r.id, name: r.name, moment: r.moment, season: r.season ?? "", reminderEnabled: r.reminderEnabled, reminderHour: r.reminderHour, reminderDays: r.reminderDays, items: r.items } : { id: 0, name: "", moment: "morning" as const, season: "", reminderEnabled: false, reminderHour: 8, reminderDays: 127, items: [] as RitualItem[] };
  }, [selected, list]);

  const [form, setForm] = useState(draft);
  const key = selected === "new" ? "new" : String(selected);
  const [editingKey, setEditingKey] = useState(key);
  if (editingKey !== key) { setEditingKey(key); setForm(draft); }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= form.items.length) return;
    const next = [...form.items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setForm((f) => ({ ...f, items: next }));
  };

  const save = () => {
    if (form.name.trim().length < 2) { toast({ kind: "error", title: t.nameRequired }); return; }
    const fd = new FormData();
    fd.set("id", form.id ? String(form.id) : "");
    fd.set("name", form.name.trim());
    fd.set("moment", form.moment);
    fd.set("season", form.season);
    fd.set("items", JSON.stringify(form.items.map(({ productId, note }) => ({ productId, note }))));
    fd.set("reminderEnabled", form.reminderEnabled ? "on" : "");
    fd.set("reminderHour", String(form.reminderHour));
    fd.set("reminderDays", String(form.reminderDays));
    start(async () => {
      const r = await saveRitualAction(null, fd);
      if (r.ok) {
        toast({ kind: "success", title: t.saved });
        const savedId = r.data?.id ?? form.id;
        setList((l) => {
          const me: RitualData = { id: savedId, name: form.name.trim(), moment: form.moment, season: form.season || null, reminderEnabled: form.reminderEnabled, reminderHour: form.reminderHour, reminderDays: form.reminderDays, items: form.items };
          const exists = l.some((x) => x.id === me.id);
          return exists ? l.map((x) => (x.id === me.id ? me : x)) : [...l, me];
        });
        if (form.id === 0 && r.data?.id) setSelected(r.data.id);
      } else toast({ kind: "error", title: r.error });
    });
  };

  const remove = (id: number) => {
    start(async () => {
      await deleteRitualAction(id);
      setList((l) => l.filter((x) => x.id !== id));
      setSelected(list.filter((x) => x.id !== id)[0]?.id ?? "new");
      toast({ kind: "success", title: t.deleted });
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="border border-line bg-bg">
        <p className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Rituels — {list.length}</p>
        <ul className="divide-y divide-line">
          {list.map((r) => (
            <li key={r.id}><button onClick={() => setSelected(r.id)} className={`w-full text-left px-4 py-3 font-sans text-[13px] hover:bg-bg-2 ${selected === r.id ? "bg-ink text-paper" : ""}`}>{r.name} <span className="ml-2 font-mono text-[10px] opacity-60">{r.items.length}</span></button></li>
          ))}
          <li><button onClick={() => setSelected("new")} className="w-full text-left px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted hover:text-ink">+ Nouveau</button></li>
        </ul>
      </aside>

      <div className="border border-line bg-bg p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Nom</span><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="field-swiss mt-2" placeholder={t.new} /></label>
          <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Thème</span><input value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} className="field-swiss mt-2" placeholder="Été · Hiver" /></label>
        </div>
        <div className="mt-6 flex border border-line w-fit">
          {(["morning", "evening"] as const).map((m) => (
            <button key={m} onClick={() => setForm((f) => ({ ...f, moment: m }))} className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.06em] ${form.moment === m ? "bg-ink text-paper" : "text-text-muted"}`}>{m === "morning" ? t.morning : t.evening}</button>
          ))}
        </div>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Étapes — {form.items.length}</p>
          <ul className="mt-3 divide-y divide-line border border-line">
            {form.items.map((it, i) => (
              <li key={`${it.productId}-${i}`} className="flex items-center gap-3 p-3">
                <span className="font-mono text-[11px] text-text-muted w-6">{String(i + 1).padStart(2, "0")}</span>
                {it.image && <span className="relative h-10 w-8 bg-bg-2 border border-line"><Image src={it.image} alt="" fill className="object-cover" /></span>}
                <span className="flex-1 truncate font-sans text-[13px]">{it.name ?? `#${it.productId}`}</span>
                <span className="flex gap-1">
                  <button onClick={() => move(i, i - 1)} className="h-7 w-7 border border-line">↑</button>
                  <button onClick={() => move(i, i + 1)} className="h-7 w-7 border border-line">↓</button>
                  <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="h-7 w-7 border border-line text-error">×</button>
                </span>
              </li>
            ))}
            {form.items.length === 0 && <li className="p-8 text-center font-mono text-[11px] text-text-muted border border-dashed border-line">{t.empty}</li>}
          </ul>
          <SearchToAdd onPick={(p) => { if (form.items.some((x) => x.productId === p.id)) return; setForm((f) => ({ ...f, items: [...f.items, { productId: p.id, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock }] })); }} />
        </div>

        <fieldset className="mt-8 border border-line p-4">
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em]"><input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm((f) => ({ ...f, reminderEnabled: e.target.checked }))} />{t.reminder}</label>
          {form.reminderEnabled && (
            <div className="mt-4 flex items-center gap-3">
              <input type="number" min={5} max={23} value={form.reminderHour} onChange={(e) => setForm((f) => ({ ...f, reminderHour: Number(e.target.value) }))} className="field-swiss w-16" />
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, d) => {
                  const on = (form.reminderDays >> d) & 1;
                  return <button key={d} onClick={() => setForm((f) => ({ ...f, reminderDays: f.reminderDays ^ (1 << d) }))} className={`h-8 w-8 border font-mono text-[10px] ${on ? "bg-ink text-paper border-ink" : "border-line"}`}>{t.days[d]}</button>;
                })}
              </div>
            </div>
          )}
        </fieldset>

        <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
          <button onClick={save} disabled={pending} className="btn-primary">{form.id ? "Enregistrer" : t.save}</button>
          {form.id > 0 && <button onClick={() => remove(form.id)} disabled={pending} className="btn-ghost text-error">Supprimer</button>}
        </div>
      </div>
    </div>
  );
}

function SearchToAdd({ onPick }: { onPick: (p: { id: number; name: string; brandName: string | null; image: string | null; priceMillimes: number; stock: number }) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const timer = useRef<any>(null);
  const onInput = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) { setItems([]); return; }
    timer.current = setTimeout(async () => { const r = await searchCatalogAction(v); if (r.ok) setItems(r.data); }, 280);
  };
  return (
    <div className="relative mt-4">
      <input value={q} onChange={(e) => onInput(e.target.value)} placeholder="Ajouter un produit…" className="field-swiss" />
      {items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-ink bg-bg">
          {items.map((p) => (
            <li key={p.id}><button onClick={() => { onPick(p); setQ(""); setItems([]); }} className="flex w-full items-center gap-3 border-b border-line p-2 text-left hover:bg-bg-2"><span className="relative h-8 w-6 bg-bg-2 border border-line">{p.image && <Image src={p.image} alt="" fill className="object-cover" />}</span><span className="flex-1 truncate font-sans text-[12px]">{p.name}</span><span className="font-mono text-[11px]">{formatDT(p.priceMillimes)}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
