"use client";
export type StageKey = "created" | "paid" | "preparing" | "shipped" | "delivered";
export function OrderTimeline({ stages, current, status, events, createdAt, paidAt, shippedAt, deliveredAt, ...rest }: { stages?: { key: StageKey; label: string; at?: string | null; done: boolean }[]; current?: StageKey; status?: any; events?: any[]; createdAt?: any; paidAt?: any; shippedAt?: any; deliveredAt?: any; [key: string]: any }) {
  const displayStages = stages ?? [
    { key: "created" as StageKey, label: "Créée", at: createdAt, done: true },
    { key: "paid" as StageKey, label: "Payée", at: paidAt, done: !!paidAt },
    { key: "preparing" as StageKey, label: "Préparation", at: null, done: false },
    { key: "shipped" as StageKey, label: "Expédiée", at: shippedAt, done: !!shippedAt },
    { key: "delivered" as StageKey, label: "Livrée", at: deliveredAt, done: !!deliveredAt },
  ];
  return (
    <div className="border border-line bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Timeline — {status ?? current}</p>
      <div className="mt-3 flex gap-2">
        {displayStages.map((s) => (
          <div key={s.key} className="flex-1 border border-line p-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em]">{s.label}</p>
            <div className={`mt-2 h-[2px] w-full ${s.done ? "bg-ink" : "bg-line"}`} />
            {s.at && <p className="mt-1 font-mono text-[10px] text-text-muted">{typeof s.at === "string" ? new Date(s.at).toLocaleDateString() : ""}</p>}
          </div>
        ))}
      </div>
      {events && events.length > 0 && (
        <ul className="mt-4 divide-y divide-line border border-line">
          {events.map((e: any, i: number) => (
            <li key={i} className="p-2 font-mono text-[11px]"><span className="font-semibold">{e.status}</span> — {e.message ?? ""} <span className="text-text-muted">{e.at ? new Date(e.at).toLocaleDateString() : ""}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}
