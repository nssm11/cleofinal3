"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon, GripIcon, MoonIcon, PlusIcon, SunIcon, TrashIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toaster";
import { formatDTShort } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import { deleteRitualAction, saveRitualAction, searchCatalogAction } from "@/actions/experience";

/**
 * MON RITUEL — the routine builder.
 *
 * The order is the ritual, so the interaction is the gesture: rows you lift,
 * slide, and drop back onto the hairline. Native HTML5 drag for pointer
 * devices, and the same buttons remain reachable by keyboard (move-up/move-
 * down affordances under the drag handle). Saving persists the exact sequence.
 */

export type RitualItem = { productId: number; note?: string; name?: string; brandName?: string | null; image?: string | null; priceMillimes?: number; stock?: number; volume?: string | null };
export type RitualData = {
  id: number;
  name: string;
  moment: "morning" | "evening";
  season: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderDays: number;
  items: RitualItem[];
};

const DAY_COUNT = 7;

export function Rituals({ initial }: { initial: RitualData[] }) {
  const copy = useCopy();
  const t = copy.ritual;
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [list, setList] = useState<RitualData[]>(initial);
  const [selected, setSelected] = useState<number | "new">(initial[0]?.id ?? "new");
  const [pending, start] = useTransition();

  const draft = useMemo(() => {
    if (selected === "new") {
      return { id: 0, name: "", moment: "morning" as const, season: "", reminderEnabled: false, reminderHour: 8, reminderDays: 127, items: [] as RitualItem[] };
    }
    const r = list.find((x) => x.id === selected);
    return r
      ? { id: r.id, name: r.name, moment: r.moment, season: r.season ?? "", reminderEnabled: r.reminderEnabled, reminderHour: r.reminderHour, reminderDays: r.reminderDays, items: r.items }
      : { id: 0, name: "", moment: "morning" as const, season: "", reminderEnabled: false, reminderHour: 8, reminderDays: 127, items: [] as RitualItem[] };
  }, [selected, list]);

  const [form, setForm] = useState(draft);
  const key = selected === "new" ? "new" : String(selected);
  const [editingKey, setEditingKey] = useState(key);
  if (editingKey !== key) {
    setEditingKey(key);
    setForm(draft);
  }

  const setItems = (items: RitualItem[]) => setForm((f) => ({ ...f, items }));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= form.items.length) return;
    const next = [...form.items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setItems(next);
  };

  const save = () => {
    if (form.name.trim().length < 2) {
      toast({ kind: "error", title: t.nameRequired });
      return;
    }
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
          const me: RitualData = {
            id: savedId,
            name: form.name.trim(),
            moment: form.moment,
            season: form.season || null,
            reminderEnabled: form.reminderEnabled,
            reminderHour: form.reminderHour,
            reminderDays: form.reminderDays,
            items: form.items,
          };
          const exists = l.some((x) => x.id === me.id);
          return exists ? l.map((x) => (x.id === me.id ? me : x)) : [...l, me];
        });
        if (form.id === 0 && r.data?.id) setSelected(r.data.id);
      } else {
        toast({ kind: "error", title: r.error });
      }
    });
  };

  const remove = (id: number) => {
    start(async () => {
      await deleteRitualAction(id);
      setList((l) => l.filter((x) => x.id !== id));
      setSelected(l0(id));
      toast({ kind: "success", title: t.deleted });
    });
  };
  const l0 = (id: number) => {
    const rest = list.filter((x) => x.id !== id);
    return rest[0]?.id ?? "new";
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
      {/* ── The shelf of rituals ──────────────────────────────────────── */}
      <aside>
        <p className="rule-label mb-5">{t.title}</p>
        <ul className="border-t border-stone/70">
          {list.map((r) => {
            const active = selected === r.id;
            return (
              <li key={r.id} className="border-b border-stone/70">
                <button
                  onClick={() => setSelected(r.id)}
                  className={`group flex w-full items-center justify-between gap-4 py-3.5 text-start transition-colors ${active ? "text-ink" : "text-charcoal hover:text-ink"}`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {r.moment === "morning" ? <SunIcon size={12} className="text-champagne-2" /> : <MoonIcon size={12} className="text-champagne-2" />}
                      <span className="font-display text-[17px] leading-tight">{r.name}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-2">
                      {r.items.length} {copy.common.products.toLowerCase()}
                      {r.season ? ` · ${r.season}` : ""}
                    </span>
                  </span>
                  <Arrow className={active ? "text-ink" : "text-sand-2 group-hover:text-ink"} />
                </button>
              </li>
            );
          })}
          <li className="pt-3">
            <button onClick={() => setSelected("new")} className="btn-ghost min-h-10">
              <PlusIcon size={13} /> {t.new}
            </button>
          </li>
        </ul>
      </aside>

      {/* ── The composing room ────────────────────────────────────────── */}
      <motion.div key={key} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D.base, ease: EASE_LUXE }} className="min-w-0">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{t.nameLabel}</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="field" placeholder={t.new} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{t.themeLabel}</span>
            <input value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} className="field" placeholder="Été · Hiver · Voyage…" />
          </label>
        </div>

        {/* moment */}
        <div className="mt-5 inline-flex border border-stone-2/45 p-0.5" role="group" aria-label={t.moment}>
          {(["morning", "evening"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={form.moment === m}
              onClick={() => setForm((f) => ({ ...f, moment: m }))}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${form.moment === m ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {m === "morning" ? <SunIcon size={12} /> : <MoonIcon size={12} />}
              {m === "morning" ? t.morning : t.evening}
            </button>
          ))}
        </div>

        {/* steps */}
        <div className="mt-9">
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {form.items.map((it, i) => (
                <motion.li
                  layout={!reduce}
                  key={`${it.productId}-${i}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: reduce ? 0 : -12 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  draggable
                  onDragStart={(e) => {
                    (e as unknown as DragEvent).dataTransfer?.setData("text/plain", String(i));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number((e as unknown as DragEvent).dataTransfer?.getData("text/plain"));
                    if (!Number.isNaN(from)) move(from, i);
                  }}
                  className="group flex items-center gap-4 border border-stone-2/45 bg-paper/80 px-4 py-3 transition-colors hover:border-champagne/60"
                >
                  <span className="flex cursor-grab items-center gap-1 text-muted-2 active:cursor-grabbing" aria-hidden>
                    <GripIcon size={14} />
                    <span className="font-display text-[12px] italic text-champagne-2">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                  {it.image && (
                    <span className="relative h-11 w-9 shrink-0 overflow-hidden bg-marble">
                      <Image src={it.image} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-ink">{it.name ?? `#${it.productId}`}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-2">
                      {it.brandName}
                      {it.priceMillimes ? ` · ${formatDTShort(it.priceMillimes)}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 opacity-0 transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100">
                    <button onClick={() => move(i, i - 1)} aria-label="↑" className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink">↑</button>
                    <button onClick={() => move(i, i + 1)} aria-label="↓" className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink">↓</button>
                    <button onClick={() => setItems(form.items.filter((_, j) => j !== i))} aria-label={t.removeStep} className="flex h-8 w-8 items-center justify-center text-muted hover:text-error">
                      <TrashIcon size={13} />
                    </button>
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
            {form.items.length === 0 && (
              <li className="border border-dashed border-stone-2/60 px-6 py-10 text-center text-[13px] text-muted-2">{t.empty} — {t.reorderHint}</li>
            )}
          </ul>
          <p className="mt-2 text-[11px] text-muted-2">{t.reorderHint}</p>
          <SearchToAdd
            onPick={(p) => {
              if (form.items.some((x) => x.productId === p.id)) return;
              setItems([...form.items, { ...p }]);
            }}
          />
        </div>

        {/* reminder */}
        <fieldset className="mt-9 border border-stone-2/40 bg-cream/50 px-5 py-4">
          <legend className="px-2">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-2">
              <input
                type="checkbox"
                checked={form.reminderEnabled}
                onChange={(e) => setForm((f) => ({ ...f, reminderEnabled: e.target.checked }))}
                className="h-4 w-4 accent-[#a3803f]"
              />
              {t.reminder}
            </label>
          </legend>
          <p className="mt-1 text-[12.5px] text-muted">{t.reminderOn}</p>
          <div className={`mt-4 flex flex-wrap items-center gap-4 transition-opacity ${form.reminderEnabled ? "opacity-100" : "pointer-events-none opacity-40"}`}>
            <label className="flex items-center gap-2 text-[11px] text-muted">
              {t.reminderHour}
              <input
                type="number"
                min={5}
                max={23}
                value={form.reminderHour}
                onChange={(e) => setForm((f) => ({ ...f, reminderHour: Number(e.target.value) }))}
                className="field !min-h-10 w-16 text-center"
              />
            </label>
            <span className="flex gap-1" role="group" aria-label={t.reminderDays}>
              {Array.from({ length: DAY_COUNT }).map((_, d) => {
                const on = (form.reminderDays >> d) & 1;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={!!on}
                    onClick={() => setForm((f) => ({ ...f, reminderDays: f.reminderDays ^ (1 << d) }))}
                    className={`h-9 w-11 border text-[9.5px] font-bold uppercase tracking-[0.12em] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-stone-2/60 text-muted hover:text-ink"}`}
                  >
                    {t.days[d]}
                  </button>
                );
              })}
            </span>
          </div>
        </fieldset>

        {/* actions */}
        <div className="mt-9 flex flex-wrap items-center gap-5 border-t border-stone/70 pt-6">
          <button onClick={save} disabled={pending} className="btn-primary">
            {form.id ? copy.common.save : t.save}
          </button>
          <p className="text-[11.5px] italic text-muted-2">{t.benefitsLine}</p>
          {form.id > 0 && (
            <button onClick={() => remove(form.id)} disabled={pending} className="ms-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-error">
              <CloseIcon size={12} /> {t.delete}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={`shrink-0 transition-transform duration-500 rtl-mirror ${className}`}>
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/* ── the “add product” search field, debounced through the server action ── */
function SearchToAdd({ onPick }: { onPick: (p: { productId: number; id?: number; name: string; brandName: string | null; image: string | null; priceMillimes: number; stock: number }) => void }) {
  const copy = useCopy();
  const t = copy.ritual;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ id: number; slug: string; name: string; brandName: string | null; priceMillimes: number; image: string | null; stock: number }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await searchCatalogAction(v);
      if (r.ok) setItems(r.data);
    }, 280);
  };

  return (
    <div className="relative mt-5">
      <label className="mb-2 block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted">{t.addProduct}</label>
      <input value={q} onChange={(e) => onInput(e.target.value)} placeholder={t.searchPlaceholder} className="field" aria-autocomplete="list" />
      {items.length > 0 && (
        <ul role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto border border-stone-2/50 bg-cream shadow-float">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onPick({ productId: p.id, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock });
                  setQ("");
                  setItems([]);
                }}
                className="flex w-full items-center gap-3 border-b border-stone/60 px-4 py-2.5 text-start transition-colors last:border-b-0 hover:bg-paper"
              >
                <span className="relative h-10 w-8 shrink-0 overflow-hidden bg-marble">
                  {p.image && <Image src={p.image} alt="" fill sizes="32px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{p.name}</span>
                  <span className="block text-[10.5px] text-muted-2">
                    {p.brandName} · {formatDTShort(p.priceMillimes)}
                  </span>
                </span>
                <PlusIcon size={13} className="text-champagne-2" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
