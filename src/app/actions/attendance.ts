"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere, studentIdsInScope } from "@/lib/rbac";
import { attendanceSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { dateOnlyUTC } from "@/lib/utils";

export async function markAttendanceAction(input: {
  date: string;
  batchId?: string;
  entries: { studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE" }[];
}) {
  const user = await requireRole("ADMIN", "COACH");

  const parsed = attendanceSchema.safeParse({
    ...input,
    date: input.date ? new Date(input.date) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid attendance data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  if (data.entries.length === 0) {
    return { ok: false as const, error: "No students selected." };
  }

  const scopedIds = new Set(await studentIdsInScope(user));
  const validEntries = data.entries.filter((e) => scopedIds.has(e.studentId));
  if (validEntries.length === 0) {
    return { ok: false as const, error: "Access denied." };
  }

  const date = dateOnlyUTC(data.date);
  const existing = await db.attendance.findMany({
    where: {
      studentId: { in: validEntries.map((e) => e.studentId) },
      date,
    },
    select: { studentId: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentId));

  await db.$transaction(async (tx) => {
    for (const entry of validEntries) {
      if (existingSet.has(entry.studentId)) {
        await tx.attendance.updateMany({
          where: { studentId: entry.studentId, date },
          data: { status: entry.status, markedBy: user.id },
        });
      } else {
        await tx.attendance.create({
          data: {
            studentId: entry.studentId,
            date,
            status: entry.status,
            markedBy: user.id,
          },
        });
      }
    }
  });

  const names = await db.student.findMany({
    where: { id: { in: validEntries.map((e) => e.studentId) } },
    select: { id: true, fullName: true },
  });
  await logActivity({
    userId: user.id,
    type: "ATTENDANCE_MARKED",
    action: "Attendance marked",
    entity: "attendance",
    details: `${validEntries.length} students on ${date.toISOString().slice(0, 10)}`,
  });
  await notifyUsers("ADMIN", {
    title: "Attendance updated",
    body: `${user.fullName} marked attendance for ${validEntries.length} students on ${date.toISOString().slice(0, 10)}.`,
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true as const, count: validEntries.length, names };
}

export async function bulkMarkAbsentAction(input: {
  date: string;
  batchId?: string;
}) {
  const user = await requireRole("ADMIN", "COACH");
  const date = dateOnlyUTC(new Date(input.date));

  const where = {
    ...studentScopeWhere(user),
    status: "ACTIVE" as const,
    deletedAt: null,
  };
  const students = await db.student.findMany({
    where: {
      ...where,
      ...(input.batchId ? { batchId: input.batchId } : {}),
    },
    select: { id: true },
  });
  if (students.length === 0) {
    return { ok: false as const, error: "No active students found." };
  }

  const existing = await db.attendance.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, date },
    select: { studentId: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentId));

  await db.$transaction(async (tx) => {
    for (const s of students) {
      if (!existingSet.has(s.id)) {
        await tx.attendance.create({
          data: { studentId: s.id, date, status: "ABSENT", markedBy: user.id },
        });
      }
    }
  });

  await logActivity({
    userId: user.id,
    type: "ATTENDANCE_MARKED",
    action: "Bulk absent marked",
    entity: "attendance",
    details: `${students.length} students marked absent on ${date.toISOString().slice(0, 10)}`,
  });
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true as const, count: students.length };
}
