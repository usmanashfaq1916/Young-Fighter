import "server-only";
import { db } from "@/lib/db";
import { studentScopeWhere } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";
import { currentMonth } from "@/lib/utils";

export type DashboardFilters = {
  batchId?: string;
  coachId?: string;
  month?: string;
};

export type DashboardStats = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  todayAttendance: {
    present: number;
    absent: number;
    leave: number;
    late: number;
    excused: number;
    total: number;
  };
  attendancePct: number;
  feeCollected: number;
  pendingFees: number;
  overdueFees: number;
  overdueFeeCount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
  upcomingMatches: number;
  coachesCount: number;
  batchesCount: number;
};

function scopedWhere(user: SessionUser, filters: DashboardFilters) {
  const scope = studentScopeWhere(user);
  if (filters.batchId) scope.batchId = filters.batchId;
  if (filters.coachId) scope.coachId = filters.coachId;
  return scope;
}

export async function getDashboardStats(
  user: SessionUser,
  date: Date,
  filters: DashboardFilters = {}
): Promise<DashboardStats> {
  const scope = scopedWhere(user, filters);
  const activeWhere = { ...scope, status: "ACTIVE" as const, deletedAt: null };

  const [totalStudents, activeStudents, todayAttendance, feeAgg, roleCounts] =
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
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    ]);

  const month = filters.month ?? currentMonth();
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

  const counts: Record<string, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LEAVE: 0,
    LATE: 0,
    EXCUSED: 0,
  };
  for (const g of todayAttendance) counts[g.status] = g._count._all;
  const present = counts.PRESENT + counts.LATE;
  const total = present + counts.ABSENT + counts.LEAVE + counts.EXCUSED;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

  const [upcomingMatches, overdueRows] = await Promise.all([
    db.match.count({
      where: { matchDate: { gte: date } },
    }),
    db.fee.findMany({
      where: {
        student: scope,
        status: { in: ["PENDING", "PARTIAL"] },
        balance: { gt: 0 },
        dueDate: { lt: date },
      },
      select: { balance: true },
    }),
  ]);

  const coachCount =
    roleCounts.find((r) => r.role === "COACH")?._count._all ?? 0;
  const batchesCount = await db.batch.count({ where: { isActive: true } });

  return {
    totalStudents,
    activeStudents,
    inactiveStudents: Math.max(0, totalStudents - activeStudents),
    todayAttendance: {
      present: counts.PRESENT,
      absent: counts.ABSENT,
      leave: counts.LEAVE,
      late: counts.LATE,
      excused: counts.EXCUSED,
      total,
    },
    attendancePct,
    feeCollected: feeAgg._sum.paidAmount ?? 0,
    pendingFees: feeAgg._sum.balance ?? 0,
    overdueFees: overdueRows.reduce((s, f) => s + f.balance, 0),
    overdueFeeCount: overdueRows.length,
    monthlyIncome: monthIncome,
    monthlyExpenses: monthExpenses._sum.amount ?? 0,
    netProfit: monthIncome - (monthExpenses._sum.amount ?? 0),
    upcomingMatches,
    coachesCount: coachCount,
    batchesCount,
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

export async function getMonthlySeries(
  user: SessionUser,
  months = 6,
  filters: DashboardFilters = {}
): Promise<MonthPoint[]> {
  const scope = scopedWhere(user, filters);
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

    const counts: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LEAVE: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const g of att) counts[g.status] = g._count._all;
    const present = counts.PRESENT + counts.LATE;
    const total = present + counts.ABSENT + counts.LEAVE + counts.EXCUSED;

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
      status: { in: ["PENDING", "PARTIAL"] },
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

export type DistributionPoint = { name: string; value: number };

export async function getFilterOptions(user: SessionUser) {
  const [batches, coaches] = await Promise.all([
    db.batch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: "COACH", status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);
  void user;
  return { batches, coaches };
}

export async function getSkillDistribution(
  user: SessionUser,
  filters: DashboardFilters = {}
): Promise<DistributionPoint[]> {
  const scope = scopedWhere(user, filters);
  const rows = await db.student.groupBy({
    by: ["skillLevel"],
    where: { ...scope, deletedAt: null },
    _count: { _all: true },
  });
  return rows.map((r) => ({ name: r.skillLevel, value: r._count._all }));
}

export async function getBatchDistribution(
  user: SessionUser,
  filters: DashboardFilters = {}
): Promise<DistributionPoint[]> {
  const scope = scopedWhere(user, filters);
  const rows = await db.student.groupBy({
    by: ["batchId"],
    where: { ...scope, deletedAt: null, batchId: { not: null } },
    _count: { _all: true },
  });
  const batchIds = rows.map((r) => r.batchId).filter(Boolean) as string[];
  const batches = batchIds.length
    ? await db.batch.findMany({ where: { id: { in: batchIds } }, select: { id: true, name: true } })
    : [];
  const nameMap = new Map(batches.map((b) => [b.id, b.name]));
  return rows.map((r) => ({
    name: nameMap.get(r.batchId!) ?? "Unassigned",
    value: r._count._all,
  }));
}