"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { storeFile, deleteStoredFile } from "@/lib/storage";

export async function uploadStudentDocumentAction(
  studentId: string,
  input: { title: string; dataUrl: string }
) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    if (!(await assertStudentAccess(user, studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    const title = input.title.trim();
    if (!title) return { ok: false as const, error: "Please enter a document title." };
    if (!input.dataUrl) return { ok: false as const, error: "Please choose a file." };

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return { ok: false as const, error: "Student not found." };

    const mimeMatch = input.dataUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
    if (!mimeMatch) return { ok: false as const, error: "Unsupported file format." };

    const buffer = Buffer.from(input.dataUrl.replace(/^data:[^,]+,/, ""), "base64");
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return { ok: false as const, error: "File is too large (max 8 MB)." };
    }

    const stored = await storeFile(buffer, mimeMatch[1], "documents");
    const doc = await db.document.create({
      data: {
        studentId,
        title,
        type: mimeMatch[1],
        url: stored.url,
        uploadedBy: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      type: "STUDENT_UPDATED",
      action: "Document uploaded",
      entity: "student",
      entityId: studentId,
      details: `${student.fullName} · ${title}`,
    });
    revalidatePath(`/students/${studentId}`);
    return { ok: true as const, id: doc.id };
  } catch (error) {
    console.error("Upload document failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function deleteStudentDocumentAction(studentId: string, documentId: string) {
  try {
    const user = await requireRole("ADMIN", "COACH");
    if (!(await assertStudentAccess(user, studentId))) {
      return { ok: false as const, error: "Access denied." };
    }
    const doc = await db.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.studentId !== studentId) {
      return { ok: false as const, error: "Document not found." };
    }
    await deleteStoredFile(doc.url).catch(() => undefined);
    await db.document.delete({ where: { id: documentId } });
    revalidatePath(`/students/${studentId}`);
    return { ok: true as const };
  } catch (error) {
    console.error("Delete document failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}