import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import { AttendanceMark } from "@/components/attendance/attendance-mark";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await requireRole("ADMIN", "COACH");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [batches, history] = await Promise.all([
    db.batch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.attendance.findMany({
      where: {
        student: { ...studentScopeWhere(user), deletedAt: null },
        date: { gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)) },
      },
      include: { student: { select: { id: true, fullName: true, studentId: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark daily roll call and review attendance history."
      />
      <AttendanceMark batches={batches} initialMonth={month} />
      <AttendanceHistory initial={JSON.parse(JSON.stringify(history))} />
    </div>
  );
}