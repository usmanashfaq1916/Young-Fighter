"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere } from "@/lib/rbac";
import { trainingSessionSchema, trainingRecordSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { dateOnlyUTC } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export type TrainingActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type TrainingSessionRow = Prisma.TrainingSessionGetPayload<{
  include: {
    batch: { select: { id: true; name: true } };
    coach: { select: { id: true; fullName: true } };
    records: { select: { id: true; studentId: true; present: true; notes: true; highlights: true } };
  };
}>;

export async function createTrainingSessionAction(input: {
  date: string;
  batchId?: string;
  coachId?: string;
  topic: string;
  category: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
}) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    const parsed = trainingSessionSchema.safeParse({
      ...input,
      date: input.date ? new Date(input.date) : undefined,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid session data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const session = await db.trainingSession.create({
      data: {
        date: dateOnlyUTC(data.date),
        batchId: data.batchId || null,
        coachId: user.role === "COACH" ? user.id : data.coachId || null,
        topic: data.topic,
        category: data.category,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        notes: data.notes || null,
        createdBy: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      type: "TRAINING_SESSION_CREATED",
      action: "Training session created",
      entity: "training-session",
      entityId: session.id,
      details: `${data.topic} (${data.category})`,
    });
    await notifyUsers(user.role === "COACH" ? ["ADMIN"] : ["ADMIN"], {
      title: "Training session scheduled",
      body: `${data.topic} on ${data.date.toISOString().slice(0, 10)}`,
    });
    revalidatePath("/training");
    revalidatePath("/dashboard");
    return { ok: true as const, id: session.id };
  } catch (error) {
    console.error("Create training session failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updateTrainingSessionAction(
  id: string,
  input: {
    date: string;
    batchId?: string;
    coachId?: string;
    topic: string;
    category: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
  }
) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    const parsed = trainingSessionSchema.safeParse({
      ...input,
      date: input.date ? new Date(input.date) : undefined,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid session data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const session = await db.trainingSession.update({
      where: { id },
      data: {
        date: dateOnlyUTC(data.date),
        batchId: data.batchId || null,
        coachId: user.role === "COACH" ? user.id : data.coachId || null,
        topic: data.topic,
        category: data.category,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        notes: data.notes || null,
      },
    });
    await logActivity({
      userId: user.id,
      type: "TRAINING_SESSION_CREATED",
      action: "Training session updated",
      entity: "training-session",
      entityId: id,
      details: data.topic,
    });
    revalidatePath("/training");
    return { ok: true as const, id: session.id };
  } catch (error) {
    console.error("Update training session failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function deleteTrainingSessionAction(id: string) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    await db.trainingSessionRecord.deleteMany({ where: { sessionId: id } });
    await db.trainingSession.delete({ where: { id } });
    await logActivity({
      userId: user.id,
      type: "TRAINING_SESSION_CREATED",
      action: "Training session deleted",
      entity: "training-session",
      entityId: id,
    });
    revalidatePath("/training");
    return { ok: true as const };
  } catch (error) {
    console.error("Delete training session failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function saveTrainingAttendanceAction(input: {
  sessionId: string;
  entries: { studentId: string; present: boolean; notes?: string; highlights?: string }[];
}) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    const parsed = trainingRecordSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid attendance data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const session = await db.trainingSession.findUnique({
      where: { id: data.sessionId },
      select: { batchId: true, topic: true },
    });
    if (!session) return { ok: false as const, error: "Session not found." };
    if (!session.batchId) return { ok: false as const, error: "This session has no batch to record." };
    if (user.role === "COACH") {
      const inScope = await db.student.count({
        where: { ...studentScopeWhere(user), id: { in: data.entries.map((e) => e.studentId) } },
      });
      if (inScope !== data.entries.length) return { ok: false as const, error: "Access denied." };
    }
    await db.$transaction(
      data.entries.map((e) =>
        db.trainingSessionRecord.upsert({
          where: { sessionId_studentId: { sessionId: data.sessionId, studentId: e.studentId } },
          create: { sessionId: data.sessionId, studentId: e.studentId, present: e.present, notes: e.notes || null, highlights: e.highlights || null },
          update: { present: e.present, notes: e.notes || null, highlights: e.highlights || null },
        })
      )
    );
    const presentCount = data.entries.filter((e) => e.present).length;
    await logActivity({
      userId: user.id,
      type: "TRAINING_ATTENDANCE_RECORDED",
      action: "Training attendance recorded",
      entity: "training-session",
      entityId: data.sessionId,
      details: `${session.topic} — ${presentCount}/${data.entries.length} present`,
    });
    revalidatePath("/training");
    return { ok: true as const };
  } catch (error) {
    console.error("Save training attendance failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function getTrainingData() {
  const user = await requireRole("ADMIN", "COACH");
  const sessions = await db.trainingSession.findMany({
    where: user.role === "COACH" ? { OR: [{ coachId: user.id }, { batch: { coachId: user.id } }] } : {},
    include: {
      batch: { select: { id: true, name: true } },
      coach: { select: { id: true, fullName: true } },
      records: { select: { id: true, studentId: true, present: true, notes: true, highlights: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
  const [batches, coaches, studentsByBatch] = await Promise.all([
    db.batch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: "COACH", status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    db.student.findMany({
      where: { ...studentScopeWhere(user), status: "ACTIVE", deletedAt: null },
      select: { id: true, studentId: true, fullName: true, photoUrl: true, batchId: true },
      orderBy: { fullName: "asc" },
      take: 2000,
    }),
  ]);
  return JSON.parse(
    JSON.stringify({
      sessions,
      batches,
      coaches,
      students: studentsByBatch,
      today: dateOnlyUTC(new Date()).toISOString().slice(0, 10),
    })
  );
}