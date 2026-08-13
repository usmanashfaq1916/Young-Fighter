import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere, matchScopeWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const where = {
    student: { ...studentScopeWhere(user), deletedAt: null },
  };
  if (q) {
    where.student = {
      ...where.student,
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [matches, students, upcoming] = await Promise.all([
    db.match.findMany({
      where: {
        ...matchScopeWhere(user),
        ...(q
          ? { records: { some: { student: { fullName: { contains: q, mode: "insensitive" } } } } }
          : {}),
      },
      include: {
        records: {
          where: { student: { ...studentScopeWhere(user), deletedAt: null } },
          include: { student: { select: { id: true, fullName: true, studentId: true, photoUrl: true } } },
        },
      },
      orderBy: { matchDate: "desc" },
    }),
    db.student.findMany({
      where: { ...studentScopeWhere(user), status: "ACTIVE", deletedAt: null },
      select: { id: true, fullName: true, studentId: true, photoUrl: true },
      orderBy: { fullName: "asc" },
    }),
    db.match.findMany({
      where: {
        ...matchScopeWhere(user),
        matchDate: { gte: new Date() },
      },
      include: {
        records: {
          where: { student: { ...studentScopeWhere(user), deletedAt: null } },
          include: { student: { select: { id: true, fullName: true, studentId: true, photoUrl: true } } },
        },
      },
      orderBy: { matchDate: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ matches, students, upcoming });
}
