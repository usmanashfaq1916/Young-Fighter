import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere, matchScopeWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fromRaw = searchParams.get("from") ?? "";
  const toRaw = searchParams.get("to") ?? "";
  const month = searchParams.get("month") ?? "";

  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  if ((fromRaw && isNaN(from!.getTime())) || (toRaw && isNaN(to!.getTime()))) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const dateFilter: { gte?: Date; lte?: Date } | undefined =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;

  const scope = { ...studentScopeWhere(user), deletedAt: null };
  const isAdmin = user.role === "ADMIN";

  const [students, attendance, fees, expenses, performance, matches] = await Promise.all([
    db.student.findMany({
      where: scope,
      include: { batch: { select: { name: true } } },
      orderBy: { fullName: "asc" },
    }),
    db.attendance.findMany({
      where: { ...(dateFilter ? { date: dateFilter } : {}), student: scope },
      select: { studentId: true, date: true, status: true },
    }),
    db.fee.findMany({
      where: { month: month || undefined, student: scope },
      select: { studentId: true, month: true, monthlyFee: true, discount: true, paidAmount: true, balance: true, status: true },
    }),
    isAdmin
      ? db.expense.findMany({
          where: dateFilter ? { date: dateFilter } : {},
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
    db.performance.findMany({
      where: { student: scope },
      orderBy: { date: "desc" },
      take: 500,
    }),
    db.match.findMany({
      where: matchScopeWhere(user),
      include: { records: { include: { student: { select: { id: true, fullName: true, studentId: true } } } } },
      orderBy: { matchDate: "desc" },
      take: 100,
    }),
  ]);

  const attendanceByStudent: Record<string, { PRESENT: number; ABSENT: number; LEAVE: number; LATE: number; EXCUSED: number }> = {};
  for (const a of attendance) {
    const key = a.studentId;
    if (!attendanceByStudent[key]) attendanceByStudent[key] = { PRESENT: 0, ABSENT: 0, LEAVE: 0, LATE: 0, EXCUSED: 0 };
    attendanceByStudent[key][a.status]++;
  }

  const feesByStudent: Record<string, { paid: number; due: number; count: number }> = {};
  for (const f of fees) {
    if (!feesByStudent[f.studentId]) feesByStudent[f.studentId] = { paid: 0, due: 0, count: 0 };
    feesByStudent[f.studentId].paid += f.paidAmount;
    feesByStudent[f.studentId].due += f.balance;
    feesByStudent[f.studentId].count++;
  }

  const perfByStudent: Record<string, number[]> = {};
  for (const p of performance) {
    if (!perfByStudent[p.studentId]) perfByStudent[p.studentId] = [];
    perfByStudent[p.studentId].push(p.overallRating);
  }

  const studentById = new Map(students.map((s) => [s.id, s]));
  const byDate = new Map<string, { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number; LEAVE: number }>();
  const byBatch = new Map<string, { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number; LEAVE: number }>();
  for (const a of attendance) {
    const dk = a.date.toISOString().slice(0, 10);
    const b = byDate.get(dk) ?? { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, LEAVE: 0 };
    b[a.status as keyof typeof b]++;
    byDate.set(dk, b);

    const student = studentById.get(a.studentId);
    const batchName = student?.batch?.name ?? "Unassigned";
    const bb = byBatch.get(batchName) ?? { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, LEAVE: 0 };
    bb[a.status as keyof typeof bb]++;
    byBatch.set(batchName, bb);
  }
  const attendanceReport = {
    byDate: [...byDate.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([date, c]) => ({ date, ...c })),
    byBatch: [...byBatch.entries()].map(([batch, c]) => ({ batch, ...c })),
  };

  const totalCollected = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalDue = fees.reduce((s, f) => s + f.balance, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    summary: {
      students: students.length,
      activeStudents: students.filter((s) => s.status === "ACTIVE").length,
      attendanceRecords: attendance.length,
      // Financial analytics are ADMIN-only; coaches receive zeros (no data leak).
      totalCollected: isAdmin ? totalCollected : 0,
      totalDue: isAdmin ? totalDue : 0,
      totalExpenses: isAdmin ? totalExpenses : 0,
      netIncome: isAdmin ? totalCollected - totalExpenses : 0,
      matches: matches.length,
    },
    studentStats: students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      fullName: s.fullName,
      batch: s.batch?.name ?? null,
      status: s.status,
      monthlyFee: isAdmin ? s.monthlyFee : 0,
      attendance: attendanceByStudent[s.id] ?? { PRESENT: 0, ABSENT: 0, LEAVE: 0 },
      fees: isAdmin
        ? feesByStudent[s.id] ?? { paid: 0, due: 0, count: 0 }
        : { paid: 0, due: 0, count: 0 },
      avgRating:
        (perfByStudent[s.id]?.reduce((a, b) => a + b, 0) ?? 0) /
        Math.max(1, perfByStudent[s.id]?.length ?? 0),
      performanceCount: perfByStudent[s.id]?.length ?? 0,
    })),
    expenses: isAdmin ? expenses : [],
    matches,
    attendanceReport,
  });
}
