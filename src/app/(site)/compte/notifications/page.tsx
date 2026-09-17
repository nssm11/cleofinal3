import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, unreadCountByCategory } from "@/lib/notifications";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/connexion?next=/compte/notifications");
  const [{ items, hasMore }, byCategory] = await Promise.all([listNotifications(me.id, {}), unreadCountByCategory(me.id)]);

  return (
    <div className="max-w-[64rem]">
      <div className="border-b border-line pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Compte — 02</p>
        <h1 className="mt-2 font-sans text-[32px] font-semibold tracking-[-0.02em] leading-[1.0]">Notifications</h1>
        <p className="mt-3 font-sans text-[14px] text-text-secondary max-w-[50ch]">Votre courrier — chaque événement validé par la maison.</p>
      </div>
      <div className="mt-8 border border-line bg-bg p-6">
        <NotificationCenter initial={items.map((n) => ({ id: n.id, category: n.category, title: n.title, body: n.body, href: n.href, priority: n.priority, readAt: n.readAt ? n.readAt.toISOString() : null, createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt) }))} initialHasMore={hasMore} initialByCategory={byCategory} />
      </div>
    </div>
  );
}
