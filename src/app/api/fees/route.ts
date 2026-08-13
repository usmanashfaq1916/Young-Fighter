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

  const studentWhere: Prisma.StudentWhereInput = {
    ...studentScopeWhere(user),
    deletedAt: null,
    ...(batchId ? { batchId } : {}),
  };
  const where: Prisma.FeeWhereInput = {
    ...(month ? { month } : {}),
    ...(status ? { status: status as never } : {}),
    student: studentWhere,
  };
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

  const [fees, total, summary] = await Promise.all([
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
  ]);

  return NextResponse.json({
    fees,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    summary: {
      totalCollected: summary._sum.paidAmount ?? 0,
      totalDue: summary._sum.balance ?? 0,
      expected: summary._sum.monthlyFee ?? 0,
      count: summary._count._all,
    },
  });
}
