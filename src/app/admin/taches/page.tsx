import { alias } from "drizzle-orm/pg-core";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminTasks, users } from "@/db/schema";
import { TasksBoard } from "@/components/admin/os/tasks-board";
import { requestNow } from "@/lib/admin/period";
import { PageHead, StatStrip } from "@/components/admin/os/modules";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { Sheet } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre de tâches" };

const ts = (v: Date | string | null) => (v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString());

/**
 * CENTRE DE TÂCHES
 *
 * The work queue of the house: what the hand wrote down, what an alert
 * proposed, what an automation decided. Four columns, real assignees, real
 * deadlines, and a link back to the object each task is about.
 */
export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  const creator = alias(users, "creator");
  const [rows_, staff] = await Promise.all([
    db
      .select({
        id: adminTasks.id, title: adminTasks.title, detail: adminTasks.detail, priority: adminTasks.priority,
        status: adminTasks.status, source: adminTasks.source, entity: adminTasks.entity, entityId: adminTasks.entityId,
        href: adminTasks.href, assigneeId: adminTasks.assigneeId, dueAt: adminTasks.dueAt, closedAt: adminTasks.closedAt,
        createdAt: adminTasks.createdAt,
        assignee: sql<string | null>`NULLIF(${users.firstName} || ' ' || ${users.lastName}, ' ')`,
        createdBy: sql<string | null>`NULLIF(${users.firstName} || ' ' || ${users.lastName}, ' ')`,
      })
      .from(adminTasks)
      .leftJoin(users, eq(users.id, adminTasks.assigneeId))
      .leftJoin(creator, eq(creator.id, adminTasks.createdById))
      .orderBy(desc(adminTasks.createdAt))
      .limit(300),
    db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).where(inArray(users.role, ["admin", "support"])),
  ]);

  const tasks = rows_.map((t) => ({
    id: t.id, title: t.title, detail: t.detail, priority: t.priority, status: t.status, source: t.source,
    entity: t.entity, entityId: t.entityId, href: t.href, assigneeId: t.assigneeId,
    assignee: t.assignee, dueAt: ts(t.dueAt), closedAt: ts(t.closedAt), createdAt: ts(t.createdAt)!, createdBy: t.createdBy,
  }));

  const now = requestNow();
  const open = tasks.filter((t) => t.status === "open").length;
  const running = tasks.filter((t) => t.status === "in_progress").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const late = tasks.filter((t) => t.status !== "done" && t.dueAt != null && new Date(t.dueAt).getTime() < now).length;
  const unassigned = tasks.filter((t) => t.status !== "done" && t.assigneeId == null).length;
  const closed7 = tasks.filter((t) => t.status === "done" && t.closedAt != null && now - new Date(t.closedAt).getTime() < 7 * 86_400_000).length;
  const bySource = ["hand", "alert", "automation", "system"].map((s) => ({ source: s, n: tasks.filter((t) => t.source === s).length }));

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Opérations · file de travail"
        icon="check"
        title="Centre de tâches"
        sub="Ce que la maison s'est promis de faire. Chaque tâche garde son origine, son objet et la personne qui la porte — et se ferme d'un clic, jamais en silence."
      />

      <StatStrip
        items={[
          { label: "À faire", value: <AnimatedNumber value={open} />, sub: `${unassigned} non confiée(s)`, tone: open ? "warn" : "good" },
          { label: "En cours", value: <AnimatedNumber value={running} />, sub: `${blocked} bloquée(s)`, tone: "neutral" },
          { label: "En retard", value: <AnimatedNumber value={late} />, sub: late ? "échéance dépassée, non close" : "rien de dépassé", tone: late ? "bad" : "good" },
          { label: "Closes · 7 jours", value: <AnimatedNumber value={closed7} />, sub: `${tasks.length} tâche(s) au total`, tone: "gold" },
        ]}
      />

      <TasksBoard
        tasks={tasks}
        staff={staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim() || s.id.toString() }))}
        initialOpen={flat.nouvelle === "1"}
      />

      <Sheet className="mt-3">
        <p className="os-label text-ops-muted">D&apos;où viennent les tâches</p>
        <ul className="mt-2 grid gap-1.5 text-[12.5px] text-ops-muted sm:grid-cols-2">
          {bySource.map((s) => (
            <li key={s.source} className="flex items-center justify-between gap-3 border-b border-ops-line-soft pb-1.5">
              <span>
                {s.source === "hand" ? "Saisie à la main — un membre de l'équipe a écrit la promesse." :
                 s.source === "alert" ? "Versée depuis le Centre d'attention — une alerte est devenue un travail." :
                 s.source === "automation" ? "Créée par une automatisation (déclencheur, conditions satisfaites)." :
                 "Créée par le système (seuil franchi, file bloquée)."}
              </span>
              <span className="os-num text-ops-ink">{s.n}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ops-faint">
          Supprimer une tâche ne laisse aucune trace dans le journal d&apos;audit — la fermer, si. Une promesse qu&apos;on abandonne se ferme avec le motif, jamais en silence.
        </p>
      </Sheet>
    </div>
  );
}
