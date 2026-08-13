import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");

  const [notifications, announcements] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app alerts and academy announcements."
      />
      <NotificationsList
        initial={JSON.parse(JSON.stringify(notifications))}
        announcements={JSON.parse(JSON.stringify(announcements))}
        role={user.role}
      />
    </div>
  );
}