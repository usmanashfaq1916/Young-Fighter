import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/rbac";
import { StudentProfile } from "@/components/students/student-profile";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole("ADMIN", "COACH");
  const { id } = await params;
  const { tab } = await searchParams;

  if (!(await assertStudentAccess(user, id))) {
    redirect(user.role === "ADMIN" ? "/forbidden" : "/coach");
  }

  const student = await db.student.findFirst({
    where: { id, deletedAt: null },
    include: {
      batch: { select: { id: true, name: true } },
      coach: { select: { id: true, fullName: true } },
      parentLinks: {
        include: {
          parent: {
            select: { id: true, fullName: true, email: true, mobile: true },
          },
        },
      },
    },
  });
  if (!student) notFound();

  const isAdmin = user.role === "ADMIN";

  const [attendance, fees, performance, matches, upcomingDues, attendanceRecords, goals, training, documents] =
    await Promise.all([
      db.attendance.groupBy({
        by: ["status"],
        where: { studentId: id },
        _count: { _all: true },
      }),
      isAdmin
        ? db.fee.findMany({ where: { studentId: id }, orderBy: { month: "desc" } })
        : Promise.resolve([]),
      db.performance.findMany({
        where: { studentId: id },
        orderBy: { date: "desc" },
        take: 20,
      }),
      db.matchRecord.findMany({
        where: { studentId: id },
        orderBy: { match: { matchDate: "desc" } },
        take: 20,
        select: {
          id: true,
          selected: true,
          battingPosition: true,
          runs: true,
          ballsFaced: true,
          fours: true,
          sixes: true,
          dismissal: true,
          wickets: true,
          oversBowled: true,
          runsConceded: true,
          catches: true,
          runOuts: true,
          stumpings: true,
          manOfTheMatch: true,
          match: { select: { id: true, opponent: true, matchDate: true, result: true } },
        },
      }),
      isAdmin
        ? db.fee.findMany({
            where: { studentId: id, status: { not: "PAID" } },
            orderBy: { month: "asc" },
            take: 6,
          })
        : Promise.resolve([]),
      db.attendance.findMany({
        where: { studentId: id },
        select: { date: true, status: true },
      }),
      db.goal.findMany({
        where: { studentId: id },
        include: {
          coach: { select: { id: true, fullName: true } },
          updates: { select: { id: true, progress: true, note: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      db.trainingSessionRecord.findMany({
        where: { studentId: id },
        orderBy: { session: { date: "desc" } },
        take: 12,
        select: {
          id: true,
          present: true,
          notes: true,
          highlights: true,
          session: {
            select: {
              id: true,
              date: true,
              topic: true,
              category: true,
              location: true,
              startTime: true,
              endTime: true,
              coach: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      db.document.findMany({
        where: { studentId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
          createdAt: true,
          uploader: { select: { fullName: true } },
        },
      }),
    ]);

  type MonthCounts = {
    PRESENT: number;
    ABSENT: number;
    LEAVE: number;
    LATE: number;
    EXCUSED: number;
    total: number;
  };
  const monthlyMap = new Map<string, MonthCounts>();
  for (const r of attendanceRecords) {
    const month = `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const entry: MonthCounts = monthlyMap.get(month) ?? {
      PRESENT: 0,
      ABSENT: 0,
      LEAVE: 0,
      LATE: 0,
      EXCUSED: 0,
      total: 0,
    };
    entry[r.status] = (entry[r.status] ?? 0) + 1;
    entry.total += 1;
    monthlyMap.set(month, entry);
  }
  const monthlyAttendance = Array.from(monthlyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([month, counts]) => ({ month, ...counts }));

  const studentView = isAdmin ? student : { ...student, monthlyFee: 0 };

  return (
    <StudentProfile
      student={JSON.parse(JSON.stringify(studentView))}
      attendanceSummary={{
        PRESENT: attendance.find((a) => a.status === "PRESENT")?._count._all ?? 0,
        ABSENT: attendance.find((a) => a.status === "ABSENT")?._count._all ?? 0,
        LEAVE: attendance.find((a) => a.status === "LEAVE")?._count._all ?? 0,
        LATE: attendance.find((a) => a.status === "LATE")?._count._all ?? 0,
        EXCUSED: attendance.find((a) => a.status === "EXCUSED")?._count._all ?? 0,
      }}
      monthlyAttendance={monthlyAttendance}
      fees={JSON.parse(JSON.stringify(fees))}
      performance={JSON.parse(JSON.stringify(performance))}
      matches={JSON.parse(JSON.stringify(matches))}
      upcomingDues={JSON.parse(JSON.stringify(upcomingDues))}
      goals={JSON.parse(JSON.stringify(goals))}
      training={JSON.parse(JSON.stringify(training))}
      documents={JSON.parse(JSON.stringify(documents))}
      role={user.role}
      initialTab={tab}
    />
  );
}