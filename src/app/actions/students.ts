"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { studentScopeWhere, assertStudentAccess } from "@/lib/rbac";
import { studentSchema } from "@/lib/validation/schemas";
import { nextStudentId, generateQrToken, dateOnlyUTC } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { storeFile, deleteStoredFile } from "@/lib/storage";
import type { Prisma } from "@/generated/prisma/client";

export async function searchStudents(query: string) {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");
  if (!query.trim()) return [];
  const where: Prisma.StudentWhereInput = {
    ...studentScopeWhere(user),
    deletedAt: null,
    OR: [
      { fullName: { contains: query.trim(), mode: "insensitive" } },
      { studentId: { contains: query.trim(), mode: "insensitive" } },
      { guardianName: { contains: query.trim(), mode: "insensitive" } },
      { mobile: { contains: query.trim() } },
      { whatsapp: { contains: query.trim() } },
      { batch: { name: { contains: query.trim(), mode: "insensitive" } } },
    ],
  };
  return db.student.findMany({
    where,
    select: {
      id: true,
      studentId: true,
      fullName: true,
      guardianName: true,
      mobile: true,
      skillLevel: true,
      photoUrl: true,
      status: true,
    },
    take: 12,
    orderBy: { fullName: "asc" },
  });
}

export async function createStudentAction(input: {
  fullName: string;
  guardianName: string;
  mobile: string;
  whatsapp?: string;
  dob: string;
  gender: string;
  address?: string;
  joinDate: string;
  batchId?: string;
  skillLevel: string;
  monthlyFee: number;
  emergencyContact?: string;
  bloodGroup?: string;
  email?: string;
  playingRole?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  preferredPosition?: string;
  jerseyNumber?: number;
  status: string;
  photoDataUrl?: string | null;
}) {
  let photoUrl: string | null = null;
  try {
    const user = await requireRole("ADMIN", "COACH");

    const parsed = studentSchema.safeParse({
      ...input,
      dob: input.dob ? new Date(input.dob) : undefined,
      joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid student data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;

    const existingIds = await db.student.findMany({ select: { studentId: true } });
    const maxId = existingIds.reduce(
      (max, s) =>
        (parseInt(s.studentId.replace(/^YFA-/, ""), 10) || 0) >
        (parseInt(max.replace(/^YFA-/, ""), 10) || 0)
          ? s.studentId
          : max,
      "YFA-00000"
    );
    const studentId = nextStudentId(maxId);
    const qrToken = generateQrToken();

    if (input.photoDataUrl) {
      const mime = input.photoDataUrl.match(/^data:(image\/\w+);base64,/);
      if (mime) {
        const buffer = Buffer.from(
          input.photoDataUrl.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        const stored = await storeFile(buffer, mime[1], "students");
        photoUrl = stored.url;
      }
    }

    let student: Awaited<ReturnType<typeof db.student.create>> | null = null;
    let candidateId = studentId;
    for (let attempt = 0; attempt < 3 && !student; attempt++) {
      try {
        student = await db.student.create({
          data: {
            studentId: candidateId,
            qrToken,
            fullName: data.fullName,
            guardianName: data.guardianName,
            mobile: data.mobile,
            whatsapp: data.whatsapp || null,
            dob: dateOnlyUTC(data.dob),
            gender: data.gender,
            address: data.address || null,
            joinDate: dateOnlyUTC(data.joinDate),
            batchId: data.batchId || null,
            skillLevel: data.skillLevel,
            monthlyFee: data.monthlyFee,
            emergencyContact: data.emergencyContact || null,
            bloodGroup: data.bloodGroup || null,
            email: data.email || null,
            playingRole: data.playingRole || null,
            battingStyle: data.battingStyle || null,
            bowlingStyle: data.bowlingStyle || null,
            preferredPosition: data.preferredPosition || null,
            jerseyNumber: data.jerseyNumber || null,
            status: data.status,
            photoUrl,
            coachId: user.role === "COACH" ? user.id : null,
            createdBy: user.id,
          },
        });
      } catch (error) {
        const isUniqueViolation =
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "P2002";
        if (attempt < 2 && isUniqueViolation) {
          candidateId = nextStudentId(candidateId);
          continue;
        }
        throw error;
      }
    }
    if (!student) throw new Error("Failed to allocate a student ID");

    await logActivity({
      userId: user.id,
      type: "STUDENT_CREATED",
      action: "New student registered",
      entity: "student",
      entityId: student.id,
      details: `${student.fullName} (${student.studentId})`,
    });
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { ok: true as const, id: student.id, studentId: student.studentId };
  } catch (error) {
    console.error("Create student failed:", error);
    if (photoUrl) await deleteStoredFile(photoUrl);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updateStudentAction(
  id: string,
  input: {
    fullName: string;
    guardianName: string;
    mobile: string;
    whatsapp?: string;
    dob: string;
    gender: string;
    address?: string;
    joinDate: string;
    batchId?: string;
    skillLevel: string;
    monthlyFee: number;
    emergencyContact?: string;
    bloodGroup?: string;
    email?: string;
    playingRole?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    preferredPosition?: string;
    jerseyNumber?: number;
    status: string;
    photoDataUrl?: string | null;
    keepPhoto?: boolean;
  }
) {
  let photoUrl: string | null = null;
  try {
    const user = await requireRole("ADMIN", "COACH");
    if (!(await assertStudentAccess(user, id))) return { ok: false as const, error: "Access denied." };

    const parsed = studentSchema.safeParse({
      ...input,
      dob: input.dob ? new Date(input.dob) : undefined,
      joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid student data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) return { ok: false as const, error: "Student not found." };

    photoUrl = input.keepPhoto ? existing.photoUrl : null;
    if (input.photoDataUrl) {
      const mime = input.photoDataUrl.match(/^data:(image\/\w+);base64,/);
      if (mime) {
        const buffer = Buffer.from(
          input.photoDataUrl.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        const stored = await storeFile(buffer, mime[1], "students");
        if (existing.photoUrl) await deleteStoredFile(existing.photoUrl);
        photoUrl = stored.url;
      } else {
        photoUrl = existing.photoUrl;
      }
    }

    await db.student.update({
      where: { id },
      data: {
        fullName: data.fullName,
        guardianName: data.guardianName,
        mobile: data.mobile,
        whatsapp: data.whatsapp || null,
        dob: dateOnlyUTC(data.dob),
        gender: data.gender,
        address: data.address || null,
        joinDate: dateOnlyUTC(data.joinDate),
        batchId: data.batchId || null,
        skillLevel: data.skillLevel,
        monthlyFee: data.monthlyFee,
        emergencyContact: data.emergencyContact || null,
        bloodGroup: data.bloodGroup || null,
        email: data.email || null,
        playingRole: data.playingRole || null,
        battingStyle: data.battingStyle || null,
        bowlingStyle: data.bowlingStyle || null,
        preferredPosition: data.preferredPosition || null,
        jerseyNumber: data.jerseyNumber || null,
        status: data.status,
        photoUrl,
        updatedBy: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      type: "STUDENT_UPDATED",
      action: "Student updated",
      entity: "student",
      entityId: id,
      details: existing.fullName,
    });
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (error) {
    console.error("Update student failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function setStudentStatusAction(id: string, status: "ACTIVE" | "INACTIVE") {
  const user = await requireRole("ADMIN", "COACH");
  if (!(await assertStudentAccess(user, id))) return { ok: false as const, error: "Access denied." };

  const student = await db.student.findUnique({ where: { id } });
  if (!student) return { ok: false as const, error: "Student not found." };

  await db.student.update({
    where: { id },
    data: { status, updatedBy: user.id },
  });
  await logActivity({
    userId: user.id,
    type: status === "ACTIVE" ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
    action: status === "ACTIVE" ? "Student activated" : "Student deactivated",
    entity: "student",
    entityId: id,
    details: student.fullName,
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { ok: true as const };
}

export async function deleteStudentAction(id: string) {
  const user = await requireRole("ADMIN");
  const student = await db.student.findUnique({ where: { id } });
  if (!student) return { ok: false as const, error: "Student not found." };

  await db.student.update({
    where: { id },
    data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: user.id },
  });
  await logActivity({
    userId: user.id,
    type: "STUDENT_DELETED",
    action: "Student deleted (soft)",
    entity: "student",
    entityId: id,
    details: student.fullName,
  });
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export type StudentActionResult =
  | { ok: true; id?: string; studentId?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
