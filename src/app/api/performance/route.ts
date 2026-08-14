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

  const ids = records.map((r) => r.studentId);
  const previousRating = new Map<string, number | null>();
  if (ids.length > 0) {
    const history = await db.performance.findMany({
      where: { studentId: { in: ids } },
      orderBy: [{ studentId: "asc" }, { date: "asc" }],
      select: { studentId: true, date: true, overallRating: true },
    });
    const byStudent = new Map<string, { date: Date; overallRating: number }[]>();
    for (const h of history) {
      const list = byStudent.get(h.studentId) ?? [];
      list.push({ date: h.date, overallRating: h.overallRating });
      byStudent.set(h.studentId, list);
    }
    for (const r of records) {
      const list = byStudent.get(r.studentId) ?? [];
      const idx = list.findLastIndex((e) => e.date.getTime() === r.date.getTime());
      const prev = idx > 0 ? list[idx - 1] : null;
      previousRating.set(r.id, prev ? prev.overallRating : null);
    }
  }

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      previousRating: previousRating.get(r.id) ?? null,
    })),
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}
