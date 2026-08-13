import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { UsersClient } from "@/components/users/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireRole("ADMIN");

  const [users, coaches, students, linkedStudents] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        studentId: true,
        coachProfile: { select: { specialization: true } },
        coachStudents: { where: { deletedAt: null }, select: { id: true } },
        batches: { select: { id: true, name: true } },
        parentLinks: { select: { student: { select: { id: true, fullName: true, studentId: true } } } },
      },
    }),
    db.user.findMany({
      where: { role: "COACH", status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    db.student.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, fullName: true, studentId: true, coachId: true },
      orderBy: { fullName: "asc" },
    }),
    db.student.findMany({
      where: { id: { in: await db.user.findMany({ where: { studentId: { not: null } }, select: { studentId: true } }).then((u) => u.map((x) => x.studentId!)) } },
      select: { id: true, fullName: true, studentId: true },
    }),
  ]);

  const linkedStudentMap = new Map(linkedStudents.map((s) => [s.id, s]));
  const usersWithStudent = users.map((u) => ({
    ...u,
    student: u.studentId && linkedStudentMap.get(u.studentId)
      ? linkedStudentMap.get(u.studentId)!
      : null,
  }));

  return (
    <div>
      <PageHeader title="Users" description="Manage accounts, roles, coach assignments and parent links." />
      <UsersClient
        currentUser={JSON.parse(JSON.stringify(user))}
        users={JSON.parse(JSON.stringify(usersWithStudent))}
        coaches={JSON.parse(JSON.stringify(coaches))}
        students={JSON.parse(JSON.stringify(students))}
      />
    </div>
  );
}
