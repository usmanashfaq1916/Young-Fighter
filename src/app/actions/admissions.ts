"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { admissionSchema, admissionReviewSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { nextStudentId, generateQrToken, dateOnlyUTC } from "@/lib/utils";
import { ensureStudentUser, type StudentLoginResult } from "@/lib/student-user";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { Prisma } from "@/generated/prisma/client";

export type AdmissionActionResult =
  | { ok: true; id?: string; studentId?: string; login?: StudentLoginResult }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type AdmissionRow = Prisma.AdmissionGetPayload<{
  include: { preferredBatch: { select: { id: true; name: true } } };
}>;

export async function submitAdmissionAction(input: {
  studentName: string;
  dob: string;
  gender: string;
  guardianName: string;
  phone: string;
  email?: string;
  preferredBatchId?: string;
  experience?: string;
  playingRole?: string;
  message?: string;
}) {
  if (!rateLimit(await clientKey(), { max: 5, windowMs: 15 * 60_000 })) {
    return { ok: false as const, error: "Too many applications. Please try again later." };
  }
  try {
    const parsed = admissionSchema.safeParse({
      ...input,
      dob: input.dob ? new Date(input.dob) : undefined,
    });
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid application data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const admission = await db.admission.create({
      data: {
        studentName: data.studentName,
        dob: dateOnlyUTC(data.dob),
        gender: data.gender,
        guardianName: data.guardianName,
        phone: data.phone,
        email: data.email || null,
        preferredBatchId: data.preferredBatchId || null,
        experience: data.experience || null,
        playingRole: data.playingRole || null,
        message: data.message || null,
      },
    });
    await notifyUsers("ADMIN", {
      title: "New admission application",
      body: `${data.studentName} applied for admission`,
    });
    revalidatePath("/admissions");
    return { ok: true as const, id: admission.id };
  } catch (error) {
    console.error("Submit admission failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function reviewAdmissionAction(input: {
  admissionId: string;
  status: string;
  note?: string;
}) {
  try {
    const user = await requireRole("ADMIN");
    const parsed = admissionReviewSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid review data.", fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const data = parsed.data;
    const admission = await db.admission.findUnique({ where: { id: data.admissionId } });
    if (!admission) return { ok: false as const, error: "Application not found." };
    if (admission.status === "CONVERTED") {
      return { ok: false as const, error: "This application is already converted to a student." };
    }
    const updated = await db.admission.update({
      where: { id: data.admissionId },
      data: {
        status: data.status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        message: data.note ? `${admission.message || ""}\n[Review note] ${data.note}`.trim() : admission.message,
      },
    });
    await logActivity({
      userId: user.id,
      type: "ADMISSION_REVIEWED",
      action: "Admission application reviewed",
      entity: "admission",
      entityId: data.admissionId,
      details: `${updated.studentName} → ${data.status}`,
    });
    revalidatePath("/admissions");
    return { ok: true as const, id: updated.id };
  } catch (error) {
    console.error("Review admission failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function convertAdmissionAction(admissionId: string) {
  try {
    const user = await requireRole("ADMIN");
    const admission = await db.admission.findUnique({ where: { id: admissionId } });
    if (!admission) return { ok: false as const, error: "Application not found." };
    if (admission.status !== "APPROVED" && admission.status !== "NEW" && admission.status !== "REVIEW") {
      return { ok: false as const, error: "Only approved applications can be converted." };
    }
    if (admission.studentId) {
      return { ok: false as const, error: "A student was already created for this application." };
    }

    const existingIds = await db.student.findMany({ select: { studentId: true } });
    const maxId = existingIds.reduce(
      (max, s) =>
        (parseInt(s.studentId.replace(/^YFA-/, ""), 10) || 0) >
        (parseInt(max.replace(/^YFA-/, ""), 10) || 0)
          ? s.studentId
          : max,
      "YFA-00000"
    );
    const qrToken = generateQrToken();

    let student: Awaited<ReturnType<typeof db.student.create>> | null = null;
    let candidateId = nextStudentId(maxId);
    for (let attempt = 0; attempt < 3 && !student; attempt++) {
      try {
        student = await db.student.create({
          data: {
            studentId: candidateId,
            qrToken,
            fullName: admission.studentName,
            guardianName: admission.guardianName,
            mobile: admission.phone,
            email: admission.email || null,
            dob: admission.dob,
            gender: admission.gender,
            joinDate: dateOnlyUTC(new Date()),
            batchId: admission.preferredBatchId || null,
            playingRole: admission.playingRole || null,
            status: "ACTIVE",
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
    const studentId = student.studentId;

    const login = await ensureStudentUser(
      {
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        mobile: student.mobile,
      },
      user.id
    );

    await db.admission.update({
      where: { id: admissionId },
      data: { status: "CONVERTED", studentId: student.id, reviewedBy: user.id, reviewedAt: new Date() },
    });
    await logActivity({
      userId: user.id,
      type: "STUDENT_CREATED",
      action: "Student created from admission application",
      entity: "student",
      entityId: student.id,
      details: `${student.fullName} (${student.studentId})`,
    });
    revalidatePath("/admissions");
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { ok: true as const, id: student.id, studentId, login };
  } catch (error) {
    console.error("Convert admission failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function deleteAdmissionAction(admissionId: string) {
  try {
    const user = await requireRole("ADMIN");
    await db.admission.delete({ where: { id: admissionId } });
    await logActivity({
      userId: user.id,
      type: "ADMISSION_REVIEWED",
      action: "Admission application deleted",
      entity: "admission",
      entityId: admissionId,
    });
    revalidatePath("/admissions");
    return { ok: true as const };
  } catch (error) {
    console.error("Delete admission failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function getAdmissionsData() {
  await requireRole("ADMIN");
  const [admissions, batches] = await Promise.all([
    db.admission.findMany({
      include: { preferredBatch: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    db.batch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return JSON.parse(JSON.stringify({ admissions, batches }));
}

export async function getAdmissionBatches() {
  return db.batch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}