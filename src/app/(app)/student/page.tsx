import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { StudentPortal } from "@/components/portal/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const user = await requireRole("STUDENT");

  const [student, upcomingMatchRecords] = user.studentId
    ? await Promise.all([
        db.student.findUnique({
          where: { id: user.studentId },
          include: {
            batch: { select: { name: true } },
            attendance: { select: { status: true, date: true }, orderBy: { date: "desc" }, take: 90 },
            fees: { orderBy: { month: "desc" }, take: 6 },
            performances: {
              orderBy: { date: "desc" },
              take: 6,
              include: { coach: { select: { fullName: true } } },
            },
            matchRecords: {
              orderBy: { match: { matchDate: "desc" } },
              take: 10,
              include: { match: { select: { opponent: true, matchDate: true, result: true } } },
            },
            goals: {
              orderBy: { updatedAt: "desc" },
              take: 10,
              select: {
                id: true,
                title: true,
                description: true,
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
                notes: true,
                session: {
                  select: { date: true, topic: true, category: true, location: true },
                },
              },
            },
          },
        }),
        db.matchRecord.findMany({
          where: {
            studentId: user.studentId,
            match: { matchDate: { gte: new Date() } },
          },
          orderBy: { match: { matchDate: "asc" } },
          take: 5,
          include: { match: { select: { opponent: true, matchDate: true, venue: true, result: true } } },
        }),
      ])
    : [null, []];

  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <StudentPortal
      user={JSON.parse(JSON.stringify(user))}
      student={JSON.parse(JSON.stringify(student))}
      upcomingMatchRecords={JSON.parse(JSON.stringify(upcomingMatchRecords))}
      announcements={JSON.parse(JSON.stringify(announcements))}
    />
  );
}
