import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 15)));

  const where: Record<string, unknown> = {};
  if (status === "ACTIVE") where.isActive = true;
  if (status === "INACTIVE") where.isActive = false;

  const [packages, total, activeCount] = await Promise.all([
    db.package.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.package.count({ where }),
    db.package.count({ where: { isActive: true } }),
  ]);

  return NextResponse.json({
    packages,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    activeCount,
  });
}