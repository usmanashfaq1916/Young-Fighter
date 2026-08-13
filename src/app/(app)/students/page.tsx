import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import { StudentTable } from "@/components/students/student-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const user = await requireRole("ADMIN", "COACH");

  const where: Prisma.StudentWhereInput = {
    ...studentScopeWhere(user),
    deletedAt: null,
  };

  const [students, total, batches] = await Promise.all([
    db.student.findMany({
      where,
      orderBy: { fullName: "asc" },
      take: 10,
      select: {
        id: true,
        studentId: true,
        fullName: true,
        guardianName: true,
        mobile: true,
        batch: { select: { id: true, name: true } },
        skillLevel: true,
        monthlyFee: true,
        status: true,
        gender: true,
        photoUrl: true,
        joinDate: true,
      },
    }),
    db.student.count({ where }),
    db.batch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student registrations, profiles and academy details."
      />
      <StudentTable
        initial={{ students, batches, total, page: 1, pageSize: 10, pages: Math.max(1, Math.ceil(total / 10)) }}
        role={user.role}
      />
    </div>
  );
}
