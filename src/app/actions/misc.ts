"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { markAllRead, notifyUsers } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function markNotificationsReadAction() {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");
  await markAllRead(user.id);
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function markNotificationReadAction(id: string) {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");
  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function deleteNotificationAction(id: string) {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");
  await db.notification.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function createAnnouncementAction(input: {
  title: string;
  body: string;
  audience: string;
  priority: string;
  batchId?: string;
}) {
  const user = await requireRole("ADMIN");
  if (!input.title.trim() || !input.body.trim()) {
    return { ok: false as const, error: "Title and message are required." };
  }
  const priority = (["LOW", "MEDIUM", "HIGH"] as const).includes(input.priority as never)
    ? (input.priority as "LOW" | "MEDIUM" | "HIGH")
    : "MEDIUM";

  const announcement = await db.announcement.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      audience: (input.audience || "ALL") as never,
      priority,
      batchId: input.batchId || null,
      createdBy: user.id,
    },
  });

  if (input.batchId) {
    const students = await db.student.findMany({
      where: { batchId: input.batchId, deletedAt: null, status: "ACTIVE" },
      include: { parentLinks: { select: { parentId: true } } },
    });
    const studentUsers = await db.user.findMany({
      where: { role: "STUDENT", studentId: { in: students.map((s) => s.id) } },
    });
    const ids = [
      ...studentUsers.map((s) => s.id),
      ...students.flatMap((s) => s.parentLinks.map((p) => p.parentId)),
    ];
    if (ids.length > 0) {
      await notifyUsers(ids, {
        title: input.title.trim(),
        body: input.body.trim(),
        type: "announcement",
      });
    }
  } else {
    const roles = (["ADMIN", "COACH", "STUDENT", "PARENT"] as const).filter(
      (r) => input.audience === "ALL" || r === input.audience
    );
    for (const role of roles) {
      await notifyUsers(role, {
        title: input.title.trim(),
        body: input.body.trim(),
        type: "announcement",
      });
    }
  }

  await logActivity({
    userId: user.id,
    type: "ANNOUNCEMENT_CREATED",
    action: "Announcement published",
    entity: "announcement",
    entityId: announcement.id,
    details: input.title,
  });

  revalidatePath("/notifications");
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function removeStudentFromBatchAction(studentId: string, batchId: string) {
  const user = await requireRole("ADMIN");
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student || student.batchId !== batchId) {
    return { ok: false as const, error: "Student is not in this batch." };
  }
  await db.student.update({
    where: { id: studentId },
    data: { batchId: null, updatedBy: user.id },
  });
  await logActivity({
    userId: user.id,
    type: "STUDENT_UPDATED",
    action: "Student removed from batch",
    entity: "student",
    entityId: studentId,
    details: `${student.fullName} removed from batch`,
  });
  revalidatePath("/settings");
  revalidatePath(`/students/${studentId}`);
  return { ok: true as const };
}

export async function createBatchAction(input: {
  name: string;
  description?: string;
  coachId?: string;
  ageGroup?: string;
  trainingDays?: string;
  trainingTime?: string;
  trainingLocation?: string;
  capacity?: number;
  isActive?: boolean;
}) {
  await requireRole("ADMIN");
  if (!input.name.trim()) return { ok: false as const, error: "Batch name is required." };
  const existing = await db.batch.findUnique({ where: { name: input.name.trim() } });
  if (existing) return { ok: false as const, error: "A batch with this name already exists." };

  await db.batch.create({
    data: {
      name: input.name.trim(),
      description: input.description || null,
      coachId: input.coachId || null,
      ageGroup: input.ageGroup || null,
      trainingDays: input.trainingDays || null,
      trainingTime: input.trainingTime || null,
      trainingLocation: input.trainingLocation || null,
      capacity: input.capacity ?? 0,
      isActive: input.isActive ?? true,
    },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function updateBatchAction(
  id: string,
  input: {
    name: string;
    description?: string;
    coachId?: string;
    ageGroup?: string;
    trainingDays?: string;
    trainingTime?: string;
    trainingLocation?: string;
    capacity?: number;
    isActive?: boolean;
  }
) {
  await requireRole("ADMIN");
  if (!input.name.trim()) return { ok: false as const, error: "Batch name is required." };
  await db.batch.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description || null,
      coachId: input.coachId || null,
      ageGroup: input.ageGroup || null,
      trainingDays: input.trainingDays || null,
      trainingTime: input.trainingTime || null,
      trainingLocation: input.trainingLocation || null,
      capacity: input.capacity ?? 0,
      isActive: input.isActive ?? true,
    },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function deleteBatchAction(id: string) {
  await requireRole("ADMIN");
  const students = await db.student.count({ where: { batchId: id } });
  if (students > 0) {
    return { ok: false as const, error: "Cannot delete a batch that still has students." };
  }
  await db.batch.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function updateSettingsAction(input: Record<string, string>) {
  const user = await requireRole("ADMIN");
  const upserts = Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
  await Promise.all(upserts);
  await logActivity({
    userId: user.id,
    type: "SETTINGS_UPDATED",
    action: "Settings updated",
    entity: "settings",
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function inviteCoachAction(input: { fullName: string; email: string; mobile?: string }) {
  const user = await requireRole("ADMIN");
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim() || !email) {
    return { ok: false as const, error: "Name and email are required." };
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, error: "A user with this email already exists." };

  const temporaryPassword = "Coach@" + Math.random().toString(36).slice(2, 8);
  await db.user.create({
    data: {
      email,
      fullName: input.fullName.trim(),
      mobile: input.mobile || null,
      role: "COACH",
      passwordHash: await bcrypt.hash(temporaryPassword, 10),
    },
  });

  await logActivity({
    userId: user.id,
    type: "COACH_ADDED",
    action: "Coach account created",
    entity: "user",
    details: email,
  });

  revalidatePath("/coaches");
  return { ok: true as const, temporaryPassword };
}

export async function deactivateCoachAction(userId: string) {
  await requireRole("ADMIN");
  await db.user.update({
    where: { id: userId, role: "COACH" },
    data: { status: "INACTIVE", sessionVersion: { increment: 1 } },
  });
  await logActivity({
    userId: (await requireRole("ADMIN")).id,
    type: "COACH_DEACTIVATED",
    action: "Coach deactivated",
    entity: "user",
    entityId: userId,
  });
  revalidatePath("/coaches");
  return { ok: true as const };
}

export async function reactivateCoachAction(userId: string) {
  await requireRole("ADMIN");
  await db.user.update({
    where: { id: userId, role: "COACH" },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/coaches");
  return { ok: true as const };
}

export async function logReportExportAction(format: "PDF" | "EXCEL" | "CSV", scope: string) {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");
  await logActivity({
    userId: user.id,
    type: "BACKUP_EXPORTED",
    action: "Report exported",
    entity: "report",
    details: `${format} · ${scope}`,
  });
  return { ok: true as const };
}
