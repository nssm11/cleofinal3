"use client";
export type TaskRow = { id: string | number; title: string; status: string; priority: string; assignee?: string; due?: string; [key: string]: any };
export function TasksBoard({ tasks, staff, initialOpen }: { tasks: any[]; staff?: any[]; initialOpen?: boolean }) {
  return (
    <div className="border border-line bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Tâches — {tasks.length}{staff ? ` · ${staff.length} membres` : ""}{initialOpen ? " · nouveau" : ""}</p>
      <ul className="mt-4 divide-y divide-line border border-line">
        {tasks.map((t: any) => (
          <li key={t.id} className="flex items-center justify-between p-3">
            <span className="font-sans text-[13px]">{t.title}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] border border-line px-2 py-1">{t.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
