import "server-only";
import { db } from "@/lib/db";
import { studentScopeWhere } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";
import { currentMonth } from "@/lib/utils";

export type DashboardStats = {
  totalStudents: number;
  activeStudents: number;
  todayAttendance: { present: number; absent: number; leave: number; total: number };
  attendancePct: number;
  feeCollected: number;
  pendingFees: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
  upcomingMatches: number;
};

export async function getDashboardStats(
  user: SessionUser,
  date: Date
): Promise<DashboardStats> {
  const scope = studentScopeWhere(user);
  const activeWhere = { ...scope, status: "ACTIVE" as const, deletedAt: null };

  const [totalStudents, activeStudents, todayAttendance, feeAgg] =
    await Promise.all([
      db.student.count({ where: { ...scope, deletedAt: null } }),
      db.student.count({ where: activeWhere }),
      db.attendance.groupBy({
        by: ["status"],
        where: {
          date,
          student: scope,
        },
        _count: { _all: true },
      }),
      db.fee.aggregate({
        where: { student: scope },
        _sum: { paidAmount: true, balance: true },
      }),
    ]);

  const month = currentMonth();
  const monthFees = await db.fee.findMany({
    where: { student: scope, month },
    select: { paidAmount: true, balance: true, status: true },
  });

  const monthIncome = monthFees.reduce((s, f) => s + f.paidAmount, 0);
  const monthExpenses = await db.expense.aggregate({
    where: {
      date: {
        gte: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
        lt: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
      },
    },
    _sum: { amount: true },
  });

  const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
  for (const g of todayAttendance) counts[g.status] = g._count._all;
  const present = counts.PRESENT;
  const total = present + counts.ABSENT + counts.LEAVE;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

  const upcomingMatches = await db.match.count({
    where: { matchDate: { gte: date } },
  });

  return {
    totalStudents,
    activeStudents,
    todayAttendance: {
      present: counts.PRESENT,
      absent: counts.ABSENT,
      leave: counts.LEAVE,
      total,
    },
    attendancePct,
    feeCollected: feeAgg._sum.paidAmount ?? 0,
    pendingFees: feeAgg._sum.balance ?? 0,
    monthlyIncome: monthIncome,
    monthlyExpenses: monthExpenses._sum.amount ?? 0,
    netProfit: monthIncome - (monthExpenses._sum.amount ?? 0),
    upcomingMatches,
  };
}

export type MonthPoint = {
  month: string;
  label: string;
  students: number;
  attendancePct: number;
  income: number;
  expenses: number;
};

export async function getMonthlySeries(user: SessionUser, months = 6): Promise<MonthPoint[]> {
  const scope = studentScopeWhere(user);
  const now = new Date();
  const points: MonthPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const label = start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

    const [newStudents, fees, expenses, att] = await Promise.all([
      db.student.count({
        where: { ...scope, createdAt: { gte: start, lt: end } },
      }),
      db.fee.findMany({
        where: { student: scope, month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}` },
        select: { paidAmount: true },
      }),
      db.expense.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      db.attendance.groupBy({
        by: ["status"],
        where: { date: { gte: start, lt: end }, student: scope },
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    for (const g of att) counts[g.status] = g._count._all;
    const present = counts.PRESENT;
    const total = present + counts.ABSENT + counts.LEAVE;

    points.push({
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      label,
      students: newStudents,
      attendancePct: total > 0 ? Math.round((present / total) * 100) : 0,
      income: fees.reduce((s, f) => s + f.paidAmount, 0),
      expenses: expenses._sum.amount ?? 0,
    });
  }
  return points;
}

export async function getTopPlayers(user: SessionUser, limit = 5) {
  const scope = studentScopeWhere(user);
  const latest = await db.performance.findMany({
    where: {
      student: { ...scope, status: "ACTIVE", deletedAt: null },
    },
    orderBy: { date: "desc" },
    take: 500,
    include: { student: { select: { id: true, fullName: true, photoUrl: true, skillLevel: true, studentId: true } } },
  });
  const best = new Map<string, (typeof latest)[number]>();
  for (const p of latest) {
    if (!best.has(p.studentId) || p.date > best.get(p.studentId)!.date) {
      best.set(p.studentId, p);
    }
  }
  return Array.from(best.values())
    .sort((a, b) => b.overallRating - a.overallRating)
    .slice(0, limit)
    .map((p) => ({
      id: p.student.id,
      studentId: p.student.studentId,
      name: p.student.fullName,
      photoUrl: p.student.photoUrl,
      skillLevel: p.student.skillLevel,
      overallRating: p.overallRating,
    }));
}

export type DueRow = {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  balance: number;
  dueDate: Date;
  status: string;
  overdue: boolean;
};

export async function getUpcomingDues(user: SessionUser, limit = 10): Promise<DueRow[]> {
  const scope = studentScopeWhere(user);
  const now = Date.now();
  const rows = await db.fee.findMany({
    where: {
      student: scope,
      balance: { gt: 0 },
      dueDate: { lt: new Date(now + 30 * 24 * 60 * 60 * 1000) },
    },
    include: {
      student: { select: { id: true, studentId: true, fullName: true } },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student.studentId,
    studentName: r.student.fullName,
    month: r.month,
    balance: r.balance,
    dueDate: r.dueDate,
    status: r.status,
    overdue: r.dueDate.getTime() < now,
  }));
}

export async function getPaymentMethodBreakdown(user: SessionUser) {
  const scope = studentScopeWhere(user);
  const fees = await db.fee.findMany({
    where: { student: scope, paidAmount: { gt: 0 } },
    select: { paymentMethod: true, paidAmount: true },
  });
  const map = new Map<string, number>();
  for (const f of fees) {
    const key = f.paymentMethod ?? "OTHER";
    map.set(key, (map.get(key) ?? 0) + f.paidAmount);
  }
  return Array.from(map.entries()).map(([method, amount]) => ({ method, amount }));
}
