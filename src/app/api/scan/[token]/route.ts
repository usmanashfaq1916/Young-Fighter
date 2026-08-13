import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { dateOnlyUTC } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const student = await db.student.findFirst({
    where: { qrToken: token, deletedAt: null },
    select: { id: true, fullName: true, studentId: true, coachId: true, photoUrl: true, batch: { select: { name: true } } },
  });
  if (!student) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (user.role === "COACH" && student.coachId !== user.id) {
    return NextResponse.json({ error: "This student is not assigned to you" }, { status: 403 });
  }

  const { coachId: _omit, ...publicStudent } = student;

  const today = dateOnlyUTC(new Date());
  const existing = await db.attendance.findUnique({
    where: { studentId_date: { studentId: student.id, date: today } },
  });

  void _omit;

  return NextResponse.json({ student: publicStudent, todayStatus: existing?.status ?? null });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = body.status ?? "PRESENT";
  if (!["PRESENT", "ABSENT", "LEAVE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { qrToken: token, deletedAt: null },
    select: { id: true, fullName: true, studentId: true, coachId: true },
  });
  if (!student) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  if (user.role === "COACH" && student.coachId !== user.id) {
    return NextResponse.json({ error: "This student is not assigned to you" }, { status: 403 });
  }

  const { coachId: _omit, ...publicStudent } = student;

  const today = dateOnlyUTC(new Date());
  const attendance = await db.attendance.upsert({
    where: { studentId_date: { studentId: student.id, date: today } },
    update: { status: status as never, markedBy: user.id },
    create: {
      studentId: student.id,
      date: today,
      status: status as never,
      markedBy: user.id,
    },
  });

  await logActivity({
    userId: user.id,
    type: "ATTENDANCE_MARKED",
    action: "QR scan attendance",
    entity: "attendance",
    entityId: attendance.id,
    details: `${student.fullName} marked ${status} via QR`,
  });

    void _omit;

  return NextResponse.json({ ok: true, student: publicStudent, status });
}