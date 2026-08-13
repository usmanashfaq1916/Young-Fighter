import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fromRaw = searchParams.get("from") ?? "";
  const toRaw = searchParams.get("to") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 15)));

  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  if ((fromRaw && isNaN(from!.getTime())) || (toRaw && isNaN(to!.getTime()))) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (from) where.date = { gte: from };
  if (to) where.date = { ...(where.date as object), lte: to };
  if (category) where.category = category;

  const [expenses, total, byCategory, totals] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.expense.count({ where }),
    db.expense.groupBy({
      by: ["category"],
      where: from || to ? where : {},
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    expenses,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    byCategory,
    totals: { amount: totals._sum.amount ?? 0, count: totals._count._all },
  });
}
