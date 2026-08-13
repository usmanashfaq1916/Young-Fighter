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

  const [attendance, fees, performance, matches, upcomingDues] = await Promise.all([
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
        runs: true,
        wickets: true,
        catches: true,
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
  ]);

  const studentView = isAdmin
    ? student
    : { ...student, monthlyFee: 0 };

  return (
    <StudentProfile
      student={JSON.parse(JSON.stringify(studentView))}
      attendanceSummary={{
        PRESENT: attendance.find((a) => a.status === "PRESENT")?._count._all ?? 0,
        ABSENT: attendance.find((a) => a.status === "ABSENT")?._count._all ?? 0,
        LEAVE: attendance.find((a) => a.status === "LEAVE")?._count._all ?? 0,
      }}
      fees={JSON.parse(JSON.stringify(fees))}
      performance={JSON.parse(JSON.stringify(performance))}
      matches={JSON.parse(JSON.stringify(matches))}
      upcomingDues={JSON.parse(JSON.stringify(upcomingDues))}
      role={user.role}
      initialTab={tab}
    />
  );
}
