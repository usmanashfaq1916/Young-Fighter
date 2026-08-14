import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ParentPortal } from "@/components/portal/parent-portal";

export const dynamic = "force-dynamic";

export default async function ParentPortalPage() {
  const user = await requireRole("PARENT");

  const [linked, announcements] = await Promise.all([
    db.student.findMany({
      where: { parentLinks: { some: { parentId: user.id } }, deletedAt: null },
      include: {
        batch: { select: { name: true } },
        attendance: { select: { status: true, date: true }, orderBy: { date: "desc" }, take: 60 },
        fees: { orderBy: { month: "desc" }, take: 6 },
        performances: { orderBy: { date: "desc" }, take: 3 },
        goals: {
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            category: true,
            baseline: true,
            target: true,
            progress: true,
            status: true,
            deadline: true,
          },
        },
        trainingRecords: {
          orderBy: { session: { date: "desc" } },
          take: 10,
          select: {
            id: true,
            present: true,
            session: { select: { date: true, topic: true, category: true } },
          },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <ParentPortal
      user={JSON.parse(JSON.stringify(user))}
      students={JSON.parse(JSON.stringify(linked))}
      announcements={JSON.parse(JSON.stringify(announcements))}
    />
  );
}
