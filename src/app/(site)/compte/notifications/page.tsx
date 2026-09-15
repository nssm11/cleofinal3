import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { listNotifications, unreadCountByCategory } from "@/lib/notifications";
import { AccountHeader } from "@/components/account/account-ui";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

/**
 * LE COURRIER — the customer's shelf of house words.
 *
 * Server-rendered with the first page and the per-shelf counts, then handed
 * to the interactive center. The page never invents a word: every row was
 * written by a trusted server event, and every destination is validated
 * twice — at creation and at render.
 */
export default async function NotificationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/connexion?next=/compte/notifications");
  const copy = await getCopy();
  const t = copy.notifications;
  const [{ items, hasMore }, byCategory] = await Promise.all([
    listNotifications(me.id, {}),
    unreadCountByCategory(me.id),
  ]);

  return (
    <div className="max-w-[64rem]">
      <AccountHeader index="02" eyebrow={t.kicker} title={t.title} description={t.intro} />
      <Reveal y={14} amount={0.05} className="mt-9">
        <NotificationCenter
          initial={items.map((n) => ({
            id: n.id,
            category: n.category,
            title: n.title,
            body: n.body,
            href: n.href,
            priority: n.priority,
            readAt: n.readAt ? n.readAt.toISOString() : null,
            createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
          }))}
          initialHasMore={hasMore}
          initialByCategory={byCategory}
        />
      </Reveal>
    </div>
  );
}
