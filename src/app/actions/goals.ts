"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess, studentIdsInScope, activeStudentsWhere } from "@/lib/rbac";
import { goalSchema, goalProgressSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { dateOnlyUTC } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export type GoalActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type GoalRow = Prisma.GoalGetPayload<{
  include: {
    student: { select: { id: true; studentId: true; fullName: true; photoUrl: true; batch: { select: { name: true } } } };
    coach: { select: { id: true; fullName: true } };
    updates: { select: { id: true; progress: true; note: true; createdAt: true; createdBy: true } };
  };
}>;

export async function addGoalAction(input: {
  studentId: string;
  title: string;
  description?: string;
  category: string;
  baseline?: string;
  target?: string;
  progress: number;
  status: string;
  deadline?: string | null;
}) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    if (!(await assertStudentAccess(user, input.studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    const parsed = goalSchema.safeParse({
      ...input,
      deadline: input.deadline ? new Date(input.deadline) : null,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid goal data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const goal = await db.goal.create({
      data: {
        studentId: data.studentId,
        coachId: user.role === "COACH" ? user.id : null,
        title: data.title,
        description: data.description || null,
        category: data.category,
        baseline: data.baseline || null,
        target: data.target || null,
        progress: data.progress,
        status: data.status,
        deadline: data.deadline ? dateOnlyUTC(data.deadline) : null,
        createdBy: user.id,
        updates: data.progress > 0
          ? { create: { progress: data.progress, createdBy: user.id } }
          : undefined,
      },
    });
    await logActivity({
      userId: user.id,
      type: "GOAL_ADDED",
      action: "Development goal added",
      entity: "goal",
      entityId: goal.id,
      details: `${data.title}`,
    });
    revalidatePath("/goals");
    revalidatePath(`/students/${data.studentId}`);
    return { ok: true as const, id: goal.id };
  } catch (error) {
    console.error("Add goal failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updateGoalAction(
  id: string,
  input: {
    studentId: string;
    title: string;
    description?: string;
    category: string;
    baseline?: string;
    target?: string;
    progress: number;
    status: string;
    deadline?: string | null;
  }
) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    if (!(await assertStudentAccess(user, input.studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    const parsed = goalSchema.safeParse({
      ...input,
      deadline: input.deadline ? new Date(input.deadline) : null,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid goal data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const existing = await db.goal.findUnique({ where: { id }, select: { progress: true, studentId: true } });
    if (!existing || existing.studentId !== data.studentId) {
      return { ok: false as const, error: "Goal not found." };
    }
    const updated = await db.goal.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        baseline: data.baseline || null,
        target: data.target || null,
        progress: data.progress,
        status: data.status,
        deadline: data.deadline ? dateOnlyUTC(data.deadline) : null,
      },
    });
    if (data.progress !== existing.progress) {
      await db.goalUpdate.create({
        data: { goalId: id, progress: data.progress, createdBy: user.id },
      });
    }
    await logActivity({
      userId: user.id,
      type: "GOAL_UPDATED",
      action: "Development goal updated",
      entity: "goal",
      entityId: id,
      details: `${updated.title}`,
    });
    revalidatePath("/goals");
    revalidatePath(`/students/${data.studentId}`);
    return { ok: true as const, id: updated.id };
  } catch (error) {
    console.error("Update goal failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updateGoalProgressAction(input: {
  goalId: string;
  progress: number;
  note?: string;
}) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    const parsed = goalProgressSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid progress data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const goal = await db.goal.findUnique({
      where: { id: data.goalId },
      select: { studentId: true, title: true },
    });
    if (!goal) return { ok: false as const, error: "Goal not found." };
    if (!(await assertStudentAccess(user, goal.studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    const status = data.progress >= 100 ? "ACHIEVED" : data.progress > 0 ? "IN_PROGRESS" : "NOT_STARTED";
    await db.$transaction([
      db.goal.update({
        where: { id: data.goalId },
        data: { progress: data.progress, status },
      }),
      db.goalUpdate.create({
        data: { goalId: data.goalId, progress: data.progress, note: data.note || null, createdBy: user.id },
      }),
    ]);
    await logActivity({
      userId: user.id,
      type: "GOAL_UPDATED",
      action: "Goal progress updated",
      entity: "goal",
      entityId: data.goalId,
      details: `${goal.title} → ${data.progress}%`,
    });
    revalidatePath("/goals");
    revalidatePath(`/students/${goal.studentId}`);
    return { ok: true as const };
  } catch (error) {
    console.error("Update goal progress failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function deleteGoalAction(id: string) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    const goal = await db.goal.findUnique({ where: { id }, select: { studentId: true, title: true } });
    if (!goal) return { ok: false as const, error: "Goal not found." };
    if (!(await assertStudentAccess(user, goal.studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    await db.goalUpdate.deleteMany({ where: { goalId: id } });
    await db.goal.delete({ where: { id } });
    await logActivity({
      userId: user.id,
      type: "GOAL_UPDATED",
      action: "Development goal deleted",
      entity: "goal",
      entityId: id,
      details: goal.title,
    });
    revalidatePath("/goals");
    revalidatePath(`/students/${goal.studentId}`);
    return { ok: true as const };
  } catch (error) {
    console.error("Delete goal failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function getGoalsData() {
  const user = await requireRole("ADMIN", "COACH");
  const ids = await studentIdsInScope(user);
  const where: Prisma.GoalWhereInput = { studentId: { in: ids } };
  const [goals, students] = await Promise.all([
    db.goal.findMany({
      where,
      include: {
        student: { select: { id: true, studentId: true, fullName: true, photoUrl: true, batch: { select: { name: true } } } },
        coach: { select: { id: true, fullName: true } },
        updates: { select: { id: true, progress: true, note: true, createdAt: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 500,
    }),
    db.student.findMany({
      where: { ...activeStudentsWhere(user), deletedAt: null },
      select: { id: true, studentId: true, fullName: true, photoUrl: true, batch: { select: { name: true } } },
      orderBy: { fullName: "asc" },
      take: 2000,
    }),
  ]);
  const coaches = await db.user.findMany({
    where: { role: "COACH", status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
  return JSON.parse(JSON.stringify({ goals, students, coaches }));
}