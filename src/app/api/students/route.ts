import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORTS: Record<string, Prisma.StudentOrderByWithRelationInput> = {
  name: { fullName: "asc" },
  id: { studentId: "asc" },
  joinDate: { joinDate: "desc" },
  fee: { monthlyFee: "desc" },
};

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const batch = searchParams.get("batch") ?? "";
  const skill = searchParams.get("skill") ?? "";
  const status = searchParams.get("status") ?? "";
  const gender = searchParams.get("gender") ?? "";
  const sort = SORTS[searchParams.get("sort") ?? "name"] ?? SORTS.name;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.StudentWhereInput = {
    ...studentScopeWhere(user),
    deletedAt: null,
  };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { studentId: { contains: q, mode: "insensitive" } },
      { guardianName: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q } },
      { whatsapp: { contains: q } },
      { batch: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (batch) where.batchId = batch;
  if (skill) where.skillLevel = skill as never;
  if (status) where.status = status as never;
  if (gender) where.gender = gender as never;

  const [total, students, batches] = await Promise.all([
    db.student.count({ where }),
    db.student.findMany({
      where,
      orderBy: sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        studentId: true,
        fullName: true,
        guardianName: true,
        mobile: true,
        batch: { select: { id: true, name: true } },
        skillLevel: true,
        monthlyFee: true,
        status: true,
        gender: true,
        photoUrl: true,
        joinDate: true,
      },
    }),
    db.batch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const isAdmin = user.role === "ADMIN";
  const scopedStudents = students.map((s) =>
    isAdmin ? s : { ...s, monthlyFee: 0 }
  );

  return NextResponse.json({
    students: scopedStudents,
    batches,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}
