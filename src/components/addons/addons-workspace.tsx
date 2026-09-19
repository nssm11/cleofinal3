"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AddonImplementation, AddonKind } from "@/lib/addon-implementation";
import type { EnhancementMode } from "@/lib/enhancement-batches";

const STORAGE_KEY = "cleo-240-addons-state";

type LocalAddonState = {
  status: "enabled" | "working" | "done";
  note: string;
};

type StateMap = Record<string, LocalAddonState>;

const statusLabel: Record<LocalAddonState["status"], string> = {
  enabled: "Enabled",
  working: "In progress",
  done: "Done",
};

const modeLabel: Record<EnhancementMode, string> = {
  new: "New",
  existing: "Existing",
  covered: "Covered",
};

function blank(items: AddonImplementation[]): StateMap {
  return Object.fromEntries(items.map((item) => [item.id, { status: "enabled", note: "" }])) as StateMap;
}

function safeRead(items: AddonImplementation[]): StateMap {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...blank(items), ...JSON.parse(saved) } : blank(items);
  } catch {
    return blank(items);
  }
}

export function AddonsWorkspace({ items }: { items: AddonImplementation[] }) {
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState("all");
  const [mode, setMode] = useState<EnhancementMode | "all">("all");
  const [kind, setKind] = useState<AddonKind | "all">("all");
  const [status, setStatus] = useState<LocalAddonState["status"] | "all">("all");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<StateMap>(() => blank(items));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(safeRead(items));
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [items]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  const batches = useMemo(() => Array.from(new Set(items.map((item) => item.batchId))), [items]);
  const kinds = useMemo(() => Array.from(new Set(items.map((item) => item.kind))), [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const local = state[item.id] ?? { status: "enabled", note: "" };
      if (batch !== "all" && item.batchId !== batch) return false;
      if (mode !== "all" && item.mode !== mode) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      if (status !== "all" && local.status !== status) return false;
      if (!needle) return true;
      return [item.id, item.title, item.batch, item.area, item.owner, item.summary, local.note].join(" ").toLowerCase().includes(needle);
    });
  }, [batch, items, kind, mode, query, state, status]);

  const selected = items.find((item) => item.id === selectedId) ?? filtered[0] ?? items[0];
  const selectedLocal = selected ? state[selected.id] ?? { status: "enabled", note: "" } : null;

  const totals = useMemo(() => {
    const values = Object.values(state);
    return {
      enabled: values.filter((entry) => entry.status === "enabled").length,
      working: values.filter((entry) => entry.status === "working").length,
      done: values.filter((entry) => entry.status === "done").length,
    };
  }, [state]);

  function patch(id: string, patchState: Partial<LocalAddonState>) {
    setState((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { status: "enabled", note: "" }), ...patchState },
    }));
  }

  function markAll(next: LocalAddonState["status"]) {
    setState((current) => {
      const copy = { ...current };
      for (const item of filtered) copy[item.id] = { ...(copy[item.id] ?? { status: "enabled", note: "" }), status: next };
      return copy;
    });
  }

  async function copySelected() {
    if (!selected) return;
    await navigator.clipboard?.writeText(JSON.stringify({ ...selected, local: selectedLocal }, null, 2)).catch(() => undefined);
  }

  function exportJson() {
    const payload = filtered.map((item) => ({ ...item, local: state[item.id] ?? { status: "enabled", note: "" } }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleopatre-240-addons-state.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.38fr_1fr]">
      <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <div className="border border-line bg-canvas p-5">
          <p className="kicker-xs text-muted">240 add-ons control</p>
          <label className="mt-4 block">
            <span className="sr-only">Search add-ons</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, owner, route, note..."
              className="w-full border border-line bg-porcelain p-3 text-[14px] outline-none transition-colors focus:border-iodine"
            />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Select label="Batch" value={batch} onChange={setBatch} options={["all", ...batches]} />
            <Select label="Mode" value={mode} onChange={(value) => setMode(value as EnhancementMode | "all")} options={["all", "new", "existing", "covered"]} />
            <Select label="Kind" value={kind} onChange={(value) => setKind(value as AddonKind | "all")} options={["all", ...kinds]} />
            <Select label="Status" value={status} onChange={(value) => setStatus(value as LocalAddonState["status"] | "all")} options={["all", "enabled", "working", "done"]} />
          </div>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-3 xl:grid-cols-1">
          <Metric label="Enabled" value={totals.enabled} />
          <Metric label="Working" value={totals.working} />
          <Metric label="Done" value={totals.done} />
        </div>

        <div className="border border-line bg-canvas p-5">
          <p className="kicker-xs text-muted">Batch actions</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => markAll("enabled")} className="btn-ghost">Enable filtered</button>
            <button type="button" onClick={() => markAll("working")} className="btn-ghost">Work filtered</button>
            <button type="button" onClick={() => markAll("done")} className="btn-solid">Finish filtered</button>
            <button type="button" onClick={exportJson} className="btn-ghost">Export JSON</button>
            <Link href="/api/addons/export" className="btn-ghost">Export CSV</Link>
          </div>
        </div>
      </aside>

      <section className="grid gap-8 lg:grid-cols-[0.54fr_0.46fr]">
        <div className="min-h-[48rem] border border-line bg-canvas">
          <div className="flex items-center justify-between gap-4 border-b border-line p-4">
            <p className="kicker-xs text-muted">{filtered.length} visible / {items.length} installed</p>
            <Link href="/api/addons" className="text-[11px] font-bold uppercase tracking-[0.16em] text-iodine-deep">JSON feed</Link>
          </div>
          <div className="max-h-[74rem] overflow-auto">
            {filtered.map((item) => {
              const local = state[item.id] ?? { status: "enabled", note: "" };
              const active = item.id === selected?.id;
              return (
                <button
                  id={item.id}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={active ? "block w-full border-b border-line bg-iodine/10 p-4 text-left" : "block w-full border-b border-line p-4 text-left transition-colors hover:bg-porcelain"}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="kicker-xs text-faint">{item.id} · {item.kind}</span>
                    <span className="rounded-full border border-line px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{statusLabel[local.status]}</span>
                  </span>
                  <span className="mt-3 block font-ant text-[1.25rem] uppercase leading-none text-carbon">{item.title}</span>
                  <span className="mt-2 block text-[12px] leading-relaxed text-muted">{item.area} · {modeLabel[item.mode]} · {item.owner}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selected && selectedLocal && (
          <article className="border border-line bg-canvas p-5 lg:sticky lg:top-28 lg:self-start">
            <p className="kicker-xs text-muted">Selected add-on</p>
            <h2 className="mt-4 font-ant text-[2rem] uppercase leading-none text-carbon">{selected.title}</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">{selected.summary}</p>

            <div className="mt-6 grid gap-px bg-line sm:grid-cols-2">
              <Mini label="ID" value={selected.id} />
              <Mini label="Owner" value={selected.owner} />
              <Mini label="Kind" value={selected.kind} />
              <Mini label="Mode" value={modeLabel[selected.mode]} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={selected.href} className="btn-solid">{selected.primaryAction}</Link>
              <Link href={`/addons/${selected.id}`} className="btn-ghost">Detail page</Link>
              <Link href={selected.jsonHref} className="btn-ghost">JSON</Link>
              <button type="button" onClick={copySelected} className="btn-ghost">Copy record</button>
            </div>

            <div className="mt-6">
              <p className="kicker-xs text-muted">Local status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["enabled", "working", "done"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch(selected.id, { status: value })}
                    className={selectedLocal.status === value ? "rounded-full bg-carbon px-3 py-2 text-[12px] text-canvas" : "rounded-full border border-line px-3 py-2 text-[12px] text-muted transition-colors hover:border-iodine hover:text-carbon"}
                  >
                    {statusLabel[value]}
                  </button>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Implementation note</span>
                <textarea
                  value={selectedLocal.note}
                  onChange={(event) => patch(selected.id, { note: event.target.value })}
                  rows={5}
                  className="mt-2 w-full border border-line bg-porcelain p-3 text-[13px] leading-relaxed outline-none focus:border-iodine"
                  placeholder="Add operational note, rollout detail, or QA result."
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="kicker-xs text-muted">Acceptance</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
                {selected.acceptance.map((line) => (
                  <li key={line} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-iodine" />{line}</li>
                ))}
              </ul>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-line bg-canvas p-2.5 text-[12px] text-carbon outline-none focus:border-iodine">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-canvas p-4">
      <p className="kicker-xs text-muted">{label}</p>
      <p className="mt-2 font-ant text-[2rem] uppercase leading-none text-carbon">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-porcelain p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">{label}</p>
      <p className="mt-1 text-[12px] text-carbon">{value}</p>
    </div>
  );
}
