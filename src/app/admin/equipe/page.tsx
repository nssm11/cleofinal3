import Link from "next/link";
import { redirect } from "next/navigation";
import { and, count, desc, gte, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { adminTasks, auditLogs, sessions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, Initials, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";

const STAFF = ["admin", "support"] as const;

/**
 * ÉQUIPE & ACCÈS
 *
 * Un répertoire, pas une poignée : qui tient une clef de la maison, quel rôle,
 * combien de tâches ouvertes, quand elle a dernier agi. La maison n'affaiblit
 * jamais l'autorisation depuis cet écran — créer, promouvoir ou révoquer une
 * clef se fait hors de cet inventaire, avec la même rigueur que n'importe
 * quel geste sensible.
 */
export default async function Equipe() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/admin");

  const staff = await db
    .select({ u: users })
    .from(users)
    .where(inArray(users.role, STAFF))
    .orderBy(users.firstName);

  const now = new Date();

  const [taskCounts, sessionCounts, lastActions] = await Promise.all([
    db.select({ assignee: adminTasks.assigneeId, n: count() }).from(adminTasks)
      .where(and(isNotNull(adminTasks.assigneeId), inArray(adminTasks.status, ["open", "in_progress", "blocked"]))).groupBy(adminTasks.assigneeId),
    db.select({ userId: sessions.userId, n: count() }).from(sessions).where(gte(sessions.expiresAt, now)).groupBy(sessions.userId),
    db.select({ a: auditLogs }).from(auditLogs)
      .where(inArray(auditLogs.actorId, staff.map((s) => s.u.id)))
      .orderBy(desc(auditLogs.createdAt)),
  ]);

  const openTasks = (id: number) => taskCounts.find((t) => t.assignee === id)?.n ?? 0;
  const liveSessions = (id: number) => sessionCounts.find((s) => s.userId === id)?.n ?? 0;
  const lastAction = (id: number) => lastActions.find((a) => a.a.actorId === id)?.a ?? null;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-os-faint">Système · Accès</p>
          <h1 className="mt-1.5 font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.02] tracking-tight text-os-text">Équipe &amp; accès</h1>
          <p className="mt-1 max-w-[64ch] text-[13px] text-os-muted">
            {staff.length} clef(s) de la maison. Cet Ã©cran inventorie â il ne crÃ©e ni ne rÃ©voque : la promotion et la rÃ©vocation restent des gestes hors inventaire, tracÃ©s dans le journal d’audit.
          </p>
        </div>
        <Tag tone={me.role === "admin" ? "gold" : "neutral"}>{me.role === "admin" ? "Administration" : "Support"}</Tag>
      </header>

      <Sheet padded={false}>
        <div className="border-b border-os-line px-4 py-3">
          <SectionHead eyebrow="Les clefs de la maison" title="Qui peut ouvrir quoi" sub="Rôle, tâches ouvertes, sessions actives, dernier geste tracé" />
        </div>
        {staff.length === 0 ? (
          <div className="p-4"><EmptyState title="Aucune clef" why="Aucun compte d’Ã©quipe n’est enregistrÃ©." /></div>
        ) : (
          <ul className="divide-y divide-os-line-soft">
            {staff.map(({ u }) => {
              const isAdmin = u.role === "admin";
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5">
                  <Initials name={`${u.firstName} ${u.lastName}`} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] text-os-text">
                      {u.firstName} {u.lastName}
                      <Tag tone={isAdmin ? "gold" : "info"}>{isAdmin ? "Administratrice" : "Support"}</Tag>
                      {u.id === me.id && <Tag tone="neutral">vous</Tag>}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-os-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 text-[12px]">
                    <span className="text-right">
                      <span className="os-num block font-display text-[1.2rem] leading-none text-os-text">{openTasks(u.id)}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-os-faint">tâches ouvertes</span>
                    </span>
                    <span className="text-right">
                      <span className="os-num block font-display text-[1.2rem] leading-none text-os-text">{liveSessions(u.id)}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-os-faint">session(s)</span>
                    </span>
                    <span className="hidden w-44 text-right sm:block">
                      <span className="os-num block text-[12px] leading-snug text-os-text">{lastAction(u.id) ? formatDateTime(lastAction(u.id)!.createdAt) : "—"}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-os-faint">dernier geste</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-os-line bg-os-surface-2/50 px-4 py-3 text-[11px] text-os-muted">
        <span className="flex items-center gap-2">
          <Glyph name="lock" size={13} className="text-os-gold" />
          Les rÃ´les et les mots de passe ne sont ni affichÃ©s ni modifiables ici â l’autorisation ne s’affaiblit jamais depuis l’inventaire.
        </span>
        <span className="flex items-center gap-3">
          <Link href="/admin/taches" className="uppercase tracking-[0.12em] text-os-gold">Tâches</Link>
          <Link href="/admin/audit" className="uppercase tracking-[0.12em] text-os-gold">Journal d’audit</Link>
        </span>
      </div>
    </div>
  );
}
