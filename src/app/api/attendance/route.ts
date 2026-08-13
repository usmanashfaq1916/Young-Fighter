import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const month = searchParams.get("month") ?? "";

  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  // Attendance status per student for the selected date (in scope).
  const [students, attendance] = await Promise.all([
    db.student.findMany({
      where: {
        ...studentScopeWhere(user),
        status: "ACTIVE",
        deletedAt: null,
        ...(batchId ? { batchId } : {}),
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        photoUrl: true,
        batch: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    db.attendance.findMany({
      where: {
        date: new Date(date),
        student: { ...studentScopeWhere(user), deletedAt: null },
      },
      select: { studentId: true, status: true },
    }),
  ]);

  const byStudent = new Map(attendance.map((a) => [a.studentId, a.status]));

  // Month summary for stats: attendance counts per status in the given month.
  let monthSummary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(`${month}-01`);
    end.setMonth(end.getMonth() + 1);
    const rows = await db.attendance.groupBy({
      by: ["status"],
      where: {
        date: { gte: start, lt: end },
        student: { ...studentScopeWhere(user), deletedAt: null },
      },
      _count: { _all: true },
    });
    monthSummary = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    for (const r of rows) monthSummary[r.status] = r._count._all;
  }

  return NextResponse.json({
    students: students.map((s) => ({
      ...s,
      status: byStudent.get(s.id) ?? null,
    })),
    monthSummary,
  });
}
