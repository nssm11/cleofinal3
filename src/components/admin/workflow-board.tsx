"use client";

import { useMemo, useState } from "react";
import { Sheet, Tag } from "@/components/admin/os/primitives";
import { cn } from "@/lib/utils";

export type WorkflowItem = {
  id: string;
  title: string;
  detail: string;
  owner?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  status: string;
  meta?: string;
};

export function WorkflowBoard({
  columns,
  initialItems,
}: {
  columns: { key: string; label: string; hint?: string }[];
  initialItems: WorkflowItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const byStatus = useMemo(() => new Map(columns.map((column) => [column.key, items.filter((item) => item.status === column.key)])), [columns, items]);
  const move = (id: string, status: string) => setItems((cur) => cur.map((item) => item.id === id ? { ...item, status } : item));

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column, index) => (
        <Sheet key={column.key} className={cn("min-h-64", index === columns.length - 1 && "xl:col-span-1")}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="os-label text-os-gold">{column.label}</p>
              {column.hint && <p className="mt-1 text-[11px] leading-relaxed text-os-muted">{column.hint}</p>}
            </div>
            <span className="os-num text-[13px] text-os-muted">{byStatus.get(column.key)?.length ?? 0}</span>
          </div>
          <div className="space-y-3">
            {(byStatus.get(column.key) ?? []).map((item) => (
              <article key={item.id} className="border border-os-line bg-os-surface-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="os-label truncate text-os-muted">{item.id}</p>
                    <h3 className="mt-1 text-[13px] font-medium leading-snug text-os-text">{item.title}</h3>
                  </div>
                  {item.priority && <Tag tone={item.priority === "urgent" ? "bad" : item.priority === "high" ? "warn" : "neutral"}>{item.priority}</Tag>}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-os-muted">{item.detail}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-os-faint">{item.owner ?? item.meta ?? "—"}</span>
                  <select value={item.status} onChange={(event) => move(item.id, event.target.value)} className="min-h-8 border border-os-line bg-os-surface px-2 text-[11px] text-os-text outline-none">
                    {columns.map((target) => <option key={target.key} value={target.key}>{target.label}</option>)}
                  </select>
                </div>
              </article>
            ))}
          </div>
        </Sheet>
      ))}
    </div>
  );
}

export function ModerationQueue({ initialItems }: { initialItems: WorkflowItem[] }) {
  return <WorkflowBoard columns={[{ key: "pending", label: "À modérer" }, { key: "approved", label: "Approuvé" }, { key: "needs_edit", label: "À corriger" }, { key: "rejected", label: "Rejeté" }]} initialItems={initialItems} />;
}
