import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");

  let myBatchIds: string[] = [];
  if (user.role === "STUDENT" && user.studentId) {
    const st = await db.student.findUnique({ where: { id: user.studentId }, select: { batchId: true } });
    if (st?.batchId) myBatchIds = [st.batchId];
  } else if (user.role === "PARENT") {
    const links = await db.studentParent.findMany({
      where: { parentId: user.id },
      select: { student: { select: { batchId: true } } },
    });
    myBatchIds = links.map((l) => l.student.batchId).filter((b): b is string => !!b);
  } else if (user.role === "COACH") {
    const batches = await db.batch.findMany({ where: { coachId: user.id }, select: { id: true } });
    myBatchIds = batches.map((b) => b.id);
  }

  const [notifications, announcements, batches] = await Promise.all([
    db.notification.findMany({
      where: {
        OR: [{ userId: user.id }, { role: user.role, userId: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.announcement.findMany({
      where: {
        OR: [
          { audience: "ALL" },
          { audience: user.role },
          ...(myBatchIds.length > 0 ? [{ batchId: { in: myBatchIds } }] : []),
        ],
      },
      include: { batch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    user.role === "ADMIN"
      ? db.batch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app alerts and academy announcements."
      />
      <NotificationsList
        initial={JSON.parse(
          JSON.stringify(
            notifications.map((n) => ({
              ...n,
              read: n.userId === user.id ? n.read : true,
            }))
          )
        )}
        announcements={JSON.parse(JSON.stringify(announcements))}
        batches={JSON.parse(JSON.stringify(batches))}
        role={user.role}
      />
    </div>
  );
}