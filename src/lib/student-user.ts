import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const DEFAULT_STUDENT_PASSWORD = "student123";

export type StudentLoginResult = {
  created: boolean;
  username?: string;
  password?: string;
  reason?: "linked" | "email-taken";
};

/**
 * Auto-creates a STUDENT login for a newly registered student.
 * Username = the student's student ID, password = DEFAULT_STUDENT_PASSWORD.
 * Skips (and logs) when the student is already linked to a user or the
 * student ID's email is already taken by another account.
 */
export async function ensureStudentUser(
  student: { id: string; studentId: string; fullName: string; mobile: string },
  createdBy: string
): Promise<StudentLoginResult> {
  const linked = await db.user.findFirst({ where: { studentId: student.id } });
  if (linked) return { created: false, reason: "linked" };

  const email = `${student.studentId.toLowerCase()}@yfa.pk`;
  const emailTaken = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailTaken) {
    await logActivity({
      userId: createdBy,
      type: "OTHER",
      action: "Student login not auto-created (account email already in use)",
      entity: "student",
      entityId: student.id,
      details: email,
    });
    return { created: false, reason: "email-taken" };
  }

  const password = DEFAULT_STUDENT_PASSWORD;
  const mobileTaken = await db.user.findUnique({
    where: { mobile: student.mobile },
    select: { id: true },
  });
  await db.user.create({
    data: {
      email,
      mobile: mobileTaken ? null : student.mobile,
      fullName: student.fullName,
      role: "STUDENT",
      status: "ACTIVE",
      passwordHash: await bcrypt.hash(password, 10),
      studentId: student.id,
      createdBy,
    },
  });
  if (mobileTaken) {
    await logActivity({
      userId: createdBy,
      type: "OTHER",
      action: "Student login created without mobile (number already in use)",
      entity: "student",
      entityId: student.id,
      details: student.mobile,
    });
  }
  await logActivity({
    userId: createdBy,
    type: "STUDENT_CREATED",
    action: "Student login auto-created",
    entity: "user",
    entityId: student.id,
    details: `${student.studentId} / ${password}`,
  });
  return { created: true, username: student.studentId, password };
}
