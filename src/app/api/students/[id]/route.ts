import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = user.role === "ADMIN";

  const { id } = await params;
  if (!(await assertStudentAccess(user, id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const student = await db.student.findFirst({
    where: { id, deletedAt: null },
    include: {
      batch: { select: { id: true, name: true } },
    },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const [attendance, fees, performance, matches, upcomingFees] = await Promise.all([
    db.attendance.groupBy({
      by: ["status"],
      where: { studentId: id },
      _count: { _all: true },
    }),
    isAdmin
      ? db.fee.findMany({ where: { studentId: id }, orderBy: { month: "desc" }, take: 12 })
      : Promise.resolve([]),
    db.performance.findMany({ where: { studentId: id }, orderBy: { date: "desc" }, take: 12 }),
    db.matchRecord.findMany({
      where: { studentId: id },
      orderBy: { match: { matchDate: "desc" } },
      take: 10,
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

  const attendanceSummary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
  for (const a of attendance) attendanceSummary[a.status] = a._count._all;

  return NextResponse.json({
    student: {
      ...student,
      monthlyFee: isAdmin ? student.monthlyFee : 0,
      attendanceSummary,
      fees: fees.map((f) => ({
        id: f.id,
        month: f.month,
        status: f.status,
        monthlyFee: f.monthlyFee,
        discount: f.discount,
        paidAmount: f.paidAmount,
        balance: f.balance,
        paymentDate: f.paymentDate,
        paymentMethod: f.paymentMethod,
        receiptNumber: f.receiptNumber,
      })),
      performance: performance.map((p) => ({
        id: p.id,
        date: p.date,
        battingRating: p.battingRating,
        bowlingRating: p.bowlingRating,
        fieldingRating: p.fieldingRating,
        fitnessRating: p.fitnessRating,
        disciplineRating: p.disciplineRating,
        overallRating: p.overallRating,
        remarks: p.remarks,
      })),
      matches,
      upcomingFees,
    },
  });
}
