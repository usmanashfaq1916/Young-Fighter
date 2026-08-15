import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? "";
  const status = searchParams.get("status") ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 15)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trendFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const studentWhere: Prisma.StudentWhereInput = {
    ...studentScopeWhere(user),
    deletedAt: null,
    ...(batchId ? { batchId } : {}),
  };
  const where: Prisma.FeeWhereInput = {
    ...(month ? { month } : {}),
    student: studentWhere,
  };
  if (status === "OVERDUE") {
    where.status = { in: ["PENDING", "PARTIAL"] };
    where.balance = { gt: 0 };
    where.dueDate = { lt: today };
  } else if (status) {
    where.status = status as never;
  }
  if (q) {
    where.student = {
      ...studentWhere,
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { guardianName: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [fees, total, summary, overdueAgg, todayAgg, weekAgg, monthAgg, trendFees] = await Promise.all([
    db.fee.findMany({
      where,
      orderBy: [{ month: "desc" }, { student: { fullName: "asc" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            guardianName: true,
            whatsapp: true,
            photoUrl: true,
            batch: { select: { name: true } },
          },
        },
      },
    }),
    db.fee.count({ where }),
    db.fee.aggregate({
      where: { month, student: studentWhere },
      _sum: { paidAmount: true, balance: true, monthlyFee: true },
      _count: { _all: true },
    }),
    db.fee.aggregate({
      where: {
        student: studentWhere,
        status: { in: ["PENDING", "PARTIAL"] },
        balance: { gt: 0 },
        dueDate: { lt: today },
      },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    db.fee.aggregate({
      where: { student: studentWhere, paymentDate: { gte: todayStart } },
      _sum: { paidAmount: true },
    }),
    db.fee.aggregate({
      where: { student: studentWhere, paymentDate: { gte: weekStart } },
      _sum: { paidAmount: true },
    }),
    db.fee.aggregate({
      where: { student: studentWhere, paymentDate: { gte: monthStart } },
      _sum: { paidAmount: true },
    }),
    db.fee.findMany({
      where: { student: studentWhere, paymentDate: { gte: trendFrom } },
      select: { paidAmount: true, paymentDate: true },
    }),
  ]);

  const collected = summary._sum.paidAmount ?? 0;
  const expected = summary._sum.monthlyFee ?? 0;

  const monthMap = new Map<string, number>();
  for (const f of trendFees) {
    if (!f.paymentDate) continue;
    const key = `${f.paymentDate.getFullYear()}-${String(f.paymentDate.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + f.paidAmount);
  }
  const trend: { month: string; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trend.push({ month: key, collected: monthMap.get(key) ?? 0 });
  }

  return NextResponse.json({
    fees: fees.map((f) => ({
      ...f,
      overdue: f.dueDate < today && f.balance > 0 && (f.status === "PENDING" || f.status === "PARTIAL"),
    })),
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    summary: {
      totalCollected: collected,
      totalDue: summary._sum.balance ?? 0,
      expected,
      count: summary._count._all,
      overdue: overdueAgg._sum.balance ?? 0,
      overdueCount: overdueAgg._count._all,
      collectionRate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
    },
    collections: {
      today: todayAgg._sum.paidAmount ?? 0,
      week: weekAgg._sum.paidAmount ?? 0,
      month: monthAgg._sum.paidAmount ?? 0,
    },
    trend,
  });
}