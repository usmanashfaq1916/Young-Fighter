"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { coachSchema, parentSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export type UserActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const createStudentUserSchema = z.object({
  fullName: z.string().min(2, { error: "Please enter the full name." }),
  email: z.email({ error: "Please enter a valid email address." }),
  mobile: z.string().optional().or(z.literal("")),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal("")),
  studentCode: z.string().min(1, { error: "Please select a student." }),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

async function assertNotLastAdmin(targetUserId: string): Promise<boolean> {
  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });
  if (!target || target.role !== "ADMIN") return true;
  const activeAdmins = await db.user.count({
    where: { role: "ADMIN", status: "ACTIVE" },
  });
  return activeAdmins > 1;
}

export async function createUserAction(input: {
  role: "COACH" | "PARENT" | "STUDENT";
  fullName: string;
  email: string;
  mobile?: string;
  password?: string;
  specialization?: string;
  batchIds?: string[];
  studentIds?: string[];
  studentCode?: string;
  status?: string;
}): Promise<UserActionResult & { temporaryPassword?: string }> {
  const admin = await requireRole("ADMIN");
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, error: "A user with this email already exists." };

  let parsed: { fullName: string; email: string; mobile?: string; status: string };
  if (input.role === "COACH") {
    const res = coachSchema.safeParse({
      fullName: input.fullName,
      email,
      mobile: input.mobile || "",
      password: input.password || "",
      specialization: input.specialization || "",
      batchIds: input.batchIds ?? [],
      status: (input.status as never) ?? "ACTIVE",
    });
    if (!res.success) {
      return { ok: false as const, error: "Invalid coach data.", fieldErrors: res.error.flatten().fieldErrors };
    }
    parsed = res.data;
  } else if (input.role === "PARENT") {
    const res = parentSchema.safeParse({
      fullName: input.fullName,
      email,
      mobile: input.mobile || "",
      password: input.password || "",
      studentIds: input.studentIds ?? [],
      status: (input.status as never) ?? "ACTIVE",
    });
    if (!res.success) {
      return { ok: false as const, error: "Invalid parent data.", fieldErrors: res.error.flatten().fieldErrors };
    }
    parsed = res.data;
  } else {
    const res = createStudentUserSchema.safeParse({
      fullName: input.fullName,
      email,
      mobile: input.mobile || "",
      password: input.password || "",
      studentCode: input.studentCode ?? "",
      status: (input.status as never) ?? "ACTIVE",
    });
    if (!res.success) {
      return { ok: false as const, error: "Invalid student data.", fieldErrors: res.error.flatten().fieldErrors };
    }
    parsed = res.data;
  }

  const password = input.password && input.password.length >= 8 ? input.password : "User@" + Math.random().toString(36).slice(2, 8);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      fullName: parsed.fullName,
      mobile: parsed.mobile || null,
      role: input.role,
      status: (parsed.status as never) ?? "ACTIVE",
      passwordHash,
      createdBy: admin.id,
    },
  });

  if (input.role === "COACH") {
    await db.coachProfile.create({
      data: { userId: user.id, specialization: (input.specialization ?? "").trim() || null },
    });
    if (input.batchIds && input.batchIds.length > 0) {
      await db.batch.updateMany({
        where: { id: { in: input.batchIds } },
        data: { coachId: user.id },
      });
    }
  } else if (input.role === "PARENT") {
    const studentIds = input.studentIds ?? [];
    if (studentIds.length > 0) {
      const valid = await db.student.findMany({
        where: { id: { in: studentIds }, deletedAt: null },
        select: { id: true },
      });
      await db.studentParent.createMany({
        data: valid.map((s) => ({ studentId: s.id, parentId: user.id })),
        skipDuplicates: true,
      });
    }
  } else {
    const student = input.studentCode
      ? await db.student.findUnique({ where: { studentId: input.studentCode } })
      : null;
    if (!student) {
      await db.user.delete({ where: { id: user.id } });
      return { ok: false as const, error: "Selected student not found." };
    }
    const linked = await db.user.findFirst({
      where: { studentId: student.id, role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (linked) {
      await db.user.delete({ where: { id: user.id } });
      return { ok: false as const, error: "A student account already exists for this student." };
    }
    await db.user.update({
      where: { id: user.id },
      data: { studentId: student.id },
    });
  }

  await logActivity({
    userId: admin.id,
    type: "COACH_ADDED",
    action: `${input.role} user created`,
    entity: "user",
    entityId: user.id,
    details: email,
  });
  revalidatePath("/users");
  return { ok: true as const, temporaryPassword: password };
}

export async function resetUserPasswordAction(
  userId: string
): Promise<UserActionResult & { temporaryPassword?: string }> {
  const admin = await requireRole("ADMIN");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false as const, error: "User not found." };

  const password = "User@" + Math.random().toString(36).slice(2, 8);
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, sessionVersion: { increment: 1 }, updatedBy: admin.id },
  });
  await logActivity({
    userId: admin.id,
    type: "PASSWORD_RESET",
    action: "Admin reset user password",
    entity: "user",
    entityId: userId,
    details: target.email,
  });
  revalidatePath("/users");
  return { ok: true as const, temporaryPassword: password };
}

export async function updateUserRoleAction(userId: string, role: string): Promise<UserActionResult> {
  const admin = await requireRole("ADMIN");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false as const, error: "User not found." };
  if (!["ADMIN", "COACH", "STUDENT", "PARENT"].includes(role)) {
    return { ok: false as const, error: "Invalid role." };
  }
  if (target.role === role) return { ok: true as const };
  if (target.role === "ADMIN" || role === "ADMIN") {
    if (!(await assertNotLastAdmin(userId))) {
      return { ok: false as const, error: "Cannot downgrade the last active admin." };
    }
  }
  await db.user.update({
    where: { id: userId },
    data: { role: role as never, sessionVersion: { increment: 1 }, updatedBy: admin.id },
  });
  await logActivity({
    userId: admin.id,
    type: "COACH_UPDATED",
    action: "User role changed",
    entity: "user",
    entityId: userId,
    details: `${target.email}: ${target.role} -> ${role}`,
  });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "INACTIVE"): Promise<UserActionResult> {
  const admin = await requireRole("ADMIN");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false as const, error: "User not found." };
  if (status === "INACTIVE" && target.role === "ADMIN") {
    if (!(await assertNotLastAdmin(userId))) {
      return { ok: false as const, error: "Cannot deactivate the last active admin." };
    }
  }
  await db.user.update({
    where: { id: userId },
    data: { status, sessionVersion: { increment: 1 }, updatedBy: admin.id },
  });
  await logActivity({
    userId: admin.id,
    type: status === "ACTIVE" ? "COACH_ADDED" : "COACH_DEACTIVATED",
    action: status === "ACTIVE" ? "User activated" : "User deactivated",
    entity: "user",
    entityId: userId,
    details: target.email,
  });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function assignCoachToStudentsAction(
  studentIds: string[],
  coachId: string | null
): Promise<UserActionResult> {
  const admin = await requireRole("ADMIN");
  if (studentIds.length === 0) return { ok: false as const, error: "Select at least one student." };
  if (coachId) {
    const coach = await db.user.findUnique({
      where: { id: coachId, role: "COACH" },
      select: { id: true },
    });
    if (!coach) return { ok: false as const, error: "Coach not found." };
  }
  await db.student.updateMany({
    where: { id: { in: studentIds }, deletedAt: null },
    data: { coachId, updatedBy: admin.id },
  });
  await logActivity({
    userId: admin.id,
    type: "COACH_UPDATED",
    action: "Coach assigned to students",
    entity: "user",
    entityId: coachId ?? "none",
    details: `${studentIds.length} student(s)`,
  });
  revalidatePath("/users");
  revalidatePath("/students");
  return { ok: true as const };
}

export async function linkParentStudentsAction(
  parentId: string,
  studentIds: string[]
): Promise<UserActionResult> {
  const admin = await requireRole("ADMIN");
  const parent = await db.user.findUnique({
    where: { id: parentId, role: "PARENT" },
    select: { id: true },
  });
  if (!parent) return { ok: false as const, error: "Parent not found." };

  await db.$transaction(async (tx) => {
    await tx.studentParent.deleteMany({
      where: { parentId, studentId: { notIn: studentIds } },
    });
    if (studentIds.length > 0) {
      const valid = await tx.student.findMany({
        where: { id: { in: studentIds }, deletedAt: null },
        select: { id: true },
      });
      await tx.studentParent.createMany({
        data: valid.map((s) => ({ studentId: s.id, parentId })),
        skipDuplicates: true,
      });
    }
  });
  await logActivity({
    userId: admin.id,
    type: "COACH_UPDATED",
    action: "Parent-child links updated",
    entity: "user",
    entityId: parentId,
    details: `${studentIds.length} student(s)`,
  });
  revalidatePath("/users");
  return { ok: true as const };
}
