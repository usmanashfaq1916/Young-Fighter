import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { matchScopeWhere } from "@/lib/rbac";
import { CoachPortal } from "@/components/portal/coach-portal";

export const dynamic = "force-dynamic";

export default async function CoachPortalPage() {
  const user = await requireRole("COACH");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [myStudents, batches, todayAttendance, recentPerf, upcomingMatches, weekAttendance, recentActivity] =
    await Promise.all([
      db.student.findMany({
        where: { coachId: user.id, deletedAt: null, status: "ACTIVE" },
        include: { batch: { select: { name: true } } },
        orderBy: { fullName: "asc" },
        take: 100,
      }),
      db.batch.findMany({ where: { coachId: user.id }, select: { id: true, name: true } }),
      db.attendance.findMany({
        where: { date: new Date(), student: { coachId: user.id } },
        select: { studentId: true, status: true },
      }),
      db.performance.findMany({
        where: { student: { coachId: user.id } },
        orderBy: { date: "desc" },
        take: 5,
        include: { student: { select: { fullName: true, studentId: true, photoUrl: true } } },
      }),
      db.match.findMany({
        where: { ...matchScopeWhere(user), matchDate: { gte: new Date() } },
        orderBy: { matchDate: "asc" },
        take: 5,
      }),
      db.attendance.findMany({
        where: { date: { gte: weekAgo }, student: { coachId: user.id } },
        select: { date: true, status: true },
      }),
      db.attendance.findMany({
        where: { student: { coachId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { student: { select: { fullName: true, photoUrl: true, studentId: true } } },
      }),
    ]);

  const history = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const rows = weekAttendance.filter(
      (a) =>
        a.date.getFullYear() === d.getFullYear() &&
        a.date.getMonth() === d.getMonth() &&
        a.date.getDate() === d.getDate()
    );
    return {
      date: d,
      present: rows.filter((a) => a.status === "PRESENT").length,
      total: rows.length,
    };
  });

  return (
    <CoachPortal
      user={JSON.parse(JSON.stringify(user))}
      students={JSON.parse(JSON.stringify(myStudents))}
      batches={JSON.parse(JSON.stringify(batches))}
      todayAttendance={JSON.parse(JSON.stringify(todayAttendance))}
      recentPerf={JSON.parse(JSON.stringify(recentPerf))}
      upcomingMatches={JSON.parse(JSON.stringify(upcomingMatches))}
      attendanceHistory={history.map((h) => ({
        date: h.date.toISOString(),
        present: h.present,
        total: h.total,
      }))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
    />
  );
}
