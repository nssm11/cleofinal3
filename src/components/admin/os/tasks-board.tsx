"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { assignTaskAction, createTaskAction, deleteTaskAction, setTaskStatusAction } from "@/actions/admin-os";
import { useToast } from "@/components/ui/toaster";
import type { TaskPriority, TaskStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Glyph } from "./icons";
import { OsButton } from "./primitives";

/* ══════════════════════════════════════════════════════════════════════════
   FILE DE TRAVAIL
   ──────────────────────────────────────────────────────────────────────────
   A task is a promise the house made to itself. It carries its origin (hand,
   alert, automation), its object (order 412, product 88), who holds it, and
   when it was promised. Moving a task forward is one click — writing it down
   must never cost more than doing it.
   ══════════════════════════════════════════════════════════════════════════ */

export type TaskRow = {
  id: number;
  title: string;
  detail: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source: string;
  entity: string | null;
  entityId: string | null;
  href: string | null;
  assigneeId: number | null;
  assignee: string | null;
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

const COLUMNS: { key: TaskStatus; label: string; hint: string }[] = [
  { key: "open", label: "À faire", hint: "Personne ne l'a encore prise" },
  { key: "in_progress", label: "En cours", hint: "Quelqu'un y travaille maintenant" },
  { key: "blocked", label: "Bloquée", hint: "Attend quelqu'un ou quelque chose" },
  { key: "done", label: "Terminée", hint: "Close, avec le nom de qui l'a close" },
];

const PRIORITY_TONE: Record<TaskPriority, string> = {
  critical: "border-os-crit/60 text-os-crit",
  high: "border-os-warn/60 text-os-warn",
  normal: "border-os-line-strong text-os-muted",
  low: "border-os-line text-os-faint",
};
const PRIORITY_LABEL: Record<TaskPriority, string> = { critical: "Critique", high: "Élevée", normal: "Normale", low: "Basse" };
const SOURCE_LABEL: Record<string, string> = { hand: "saisie", alert: "alerte", automation: "automatisation", system: "système" };

const NEXT: Partial<Record<TaskStatus, { to: TaskStatus; label: string }[]>> = {
  open: [{ to: "in_progress", label: "Prendre" }, { to: "blocked", label: "Bloquer" }, { to: "done", label: "Terminer" }],
  in_progress: [{ to: "done", label: "Terminer" }, { to: "blocked", label: "Bloquer" }],
  blocked: [{ to: "in_progress", label: "Reprendre" }, { to: "done", label: "Terminer" }],
  done: [{ to: "open", label: "Rouvrir" }],
};

const day = new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short" });
const stamp = new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function TasksBoard({
  tasks,
  staff,
  initialOpen = false,
}: {
  tasks: TaskRow[];
  staff: { id: number; name: string }[];
  initialOpen?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [composing, setComposing] = useState(initialOpen);
  const [mine, setMine] = useState(false);
  const [draft, setDraft] = useState({ title: "", detail: "", priority: "normal" as TaskPriority, assigneeId: "", dueAt: "" });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Captured once: overdue flags stay stable while the operator works.
  const [now] = useState(() => Date.now());
  const visible = useMemo(() => (mine ? tasks.filter((t) => t.assigneeId != null) : tasks), [tasks, mine]);
  const overdue = (t: TaskRow) => t.dueAt != null && new Date(t.dueAt).getTime() < now && t.status !== "done";

  const move = (id: number, status: TaskStatus) =>
    start(async () => {
      const r = await setTaskStatusAction(id, status);
      if (r.ok) { toast({ kind: "success", title: `Tâche → ${COLUMNS.find((c) => c.key === status)?.label}` }); router.refresh(); }
      else toast({ kind: "error", title: r.error });
    });

  const assign = (id: number, assigneeId: number | null) =>
    start(async () => {
      const r = await assignTaskAction(id, assigneeId);
      if (r.ok) { toast({ kind: "success", title: assigneeId ? "Tâche confiée" : "Tâche remise au pot commun" }); router.refresh(); }
      else toast({ kind: "error", title: r.error });
    });

  const create = () =>
    start(async () => {
      const r = await createTaskAction({
        title: draft.title,
        detail: draft.detail || undefined,
        priority: draft.priority,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
        dueAt: draft.dueAt || null,
        source: "hand",
      });
      if (r.ok) {
        toast({ kind: "success", title: `Tâche créée${draft.assigneeId ? " et confiée" : ""}` });
        setDraft({ title: "", detail: "", priority: "normal", assigneeId: "", dueAt: "" });
        setComposing(false);
        router.refresh();
      } else toast({ kind: "error", title: r.error });
    });

  const remove = (id: number) =>
    start(async () => {
      const r = await deleteTaskAction(id);
      if (r.ok) { toast({ kind: "success", title: "Tâche supprimée" }); setConfirmDelete(null); router.refresh(); }
      else toast({ kind: "error", title: r.error });
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <OsButton variant={composing ? "quiet" : "primary"} onClick={() => setComposing((c) => !c)}>
          {composing ? "Fermer" : "+ Nouvelle tâche"}
        </OsButton>
        <OsButton variant={mine ? "gold" : "ghost"} onClick={() => setMine((m) => !m)}>
          {mine ? "Afficher toute l'équipe" : "Mes tâches uniquement"}
        </OsButton>
        {pending && <span className="os-num text-[11.5px] text-os-faint">écriture…</span>}
      </div>

      {composing && (
        <div className="mt-3 border border-os-line bg-os-surface p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_11rem_10rem]">
            <label className="block">
              <span className="os-label text-os-muted">Ce qu&apos;il faut faire *</span>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Rappeler la cliente du retour 412, colis bloqué au dépôt" className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2.5 text-[13px] focus:border-os-line-strong focus:outline-none" />
            </label>
            <label className="block">
              <span className="os-label text-os-muted">Priorité</span>
              <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))} className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none">
                {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="os-label text-os-muted">Confier à</span>
              <select value={draft.assigneeId} onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))} className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none">
                <option value="">Personne pour l&apos;instant</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="os-label text-os-muted">Échéance</span>
              <input type="date" value={draft.dueAt} onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))} className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none" />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="os-label text-os-muted">Détail (facultatif)</span>
            <textarea value={draft.detail} onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))} rows={2} placeholder="Ce qu'il faut savoir avant de s'en occuper : ce qui a déjà été tenté, ce qui bloque." className="mt-1 w-full border border-os-line bg-os-surface px-2.5 py-2 text-[13px] focus:border-os-line-strong focus:outline-none" />
          </label>
          <div className="mt-3 flex items-center justify-end gap-2">
            <OsButton variant="gold" disabled={pending || !draft.title.trim()} onClick={create}>Écrire la tâche</OsButton>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.key);
          return (
            <section key={col.key} className="border border-os-line bg-os-surface">
              <header className="flex items-baseline justify-between gap-2 border-b border-os-line px-3 py-2.5">
                <div>
                  <h2 className="font-display text-[15px] tracking-tight text-os-text">{col.label}</h2>
                  <p className="text-[11px] text-os-faint">{col.hint}</p>
                </div>
                <span className="os-num text-[13px] text-os-muted">{items.length}</span>
              </header>
              <ul className="divide-y divide-os-line-soft">
                {items.map((t) => (
                  <li key={t.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]", PRIORITY_TONE[t.priority])}>{PRIORITY_LABEL[t.priority]}</span>
                      <span className="text-[10px] uppercase tracking-[0.1em] text-os-faint">{SOURCE_LABEL[t.source] ?? t.source}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-snug text-os-text">{t.title}</p>
                    {t.detail && <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-os-muted">{t.detail}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-os-faint">
                      {t.href ? (
                        <Link href={t.href} className="text-os-gold hover:underline">{t.entity ? `${t.entity} ${t.entityId ?? ""}` : "ouvrir l'objet"}</Link>
                      ) : t.entity ? (
                        <span>{t.entity} {t.entityId}</span>
                      ) : null}
                      {t.dueAt && (
                        <span className={cn("os-num", overdue(t) && "text-os-crit")}>
                          {overdue(t) ? "en retard — " : "pour le "}{day.format(new Date(t.dueAt))}
                        </span>
                      )}
                      {t.status === "done" && t.closedAt && <span className="os-num">close le {stamp.format(new Date(t.closedAt))}</span>}
                      {t.status !== "done" && <span className="os-num">écrite le {stamp.format(new Date(t.createdAt))}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {(NEXT[t.status] ?? []).map((n) => (
                        <button key={n.to} disabled={pending} onClick={() => move(t.id, n.to)} className="border border-os-line px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-os-muted transition-colors hover:border-os-line-strong hover:text-os-text disabled:opacity-50">
                          {n.label}
                        </button>
                      ))}
                      <select
                        value={t.assigneeId ?? ""}
                        disabled={pending}
                        onChange={(e) => assign(t.id, e.target.value ? Number(e.target.value) : null)}
                        aria-label="Confier la tâche"
                        className="border border-os-line bg-os-surface px-1.5 py-0.5 text-[10.5px] text-os-muted focus:border-os-line-strong focus:outline-none"
                      >
                        <option value="">non confiée</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {confirmDelete === t.id ? (
                        <span className="flex items-center gap-1.5">
                          <button disabled={pending} onClick={() => remove(t.id)} className="border border-os-crit/60 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-os-crit">Confirmer</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-[10.5px] text-os-faint">non</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(t.id)} className="ml-auto p-0.5 text-os-faint transition-colors hover:text-os-crit" title="Supprimer la tâche" aria-label="Supprimer la tâche">
                          <Glyph name="trash" size={12} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="px-3 py-5 text-[11.5px] leading-relaxed text-os-muted">
                    {col.key === "open"
                      ? "Rien en attente. Les alertes du Centre d'attention peuvent être versées ici d'un clic."
                      : col.key === "done"
                        ? "Rien de terminé sur cette période — la colonne se remplit à mesure que l'équipe avance."
                        : "Aucune tâche ici."}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
