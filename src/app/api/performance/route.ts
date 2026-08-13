import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.PerformanceWhereInput = {
    student: { ...studentScopeWhere(user), deletedAt: null },
  };
  if (q) {
    where.student = {
      ...(where.student as Prisma.StudentWhereInput),
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
      ],
    };
  }
  if (batchId) {
    where.student = {
      ...(where.student as Prisma.StudentWhereInput),
      batchId,
    };
  }

  const [records, total] = await Promise.all([
    db.performance.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            photoUrl: true,
            batch: { select: { name: true } },
          },
        },
      },
    }),
    db.performance.count({ where }),
  ]);

  return NextResponse.json({
    records,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}
