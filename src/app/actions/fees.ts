"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/rbac";
import { feeSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { generateReceiptNumber, dateOnlyUTC } from "@/lib/utils";

export type FeeActionResult =
  | { ok: true; id?: string; receiptNumber?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function computeStatus(monthlyFee: number, discount: number, paidAmount: number) {
  const due = monthlyFee - discount;
  if (paidAmount >= due && due > 0) return "PAID" as const;
  if (paidAmount > 0) return "PARTIAL" as const;
  return "PENDING" as const;
}

export async function recordFeeAction(input: {
  studentId: string;
  month: string;
  monthlyFee: number;
  discount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  remarks?: string;
}) {
  const user = await requireRole("ADMIN");
  if (!(await assertStudentAccess(user, input.studentId))) {
    return { ok: false as const, error: "Access denied." };
  }

  const parsed = feeSchema.safeParse({
    ...input,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
    paymentMethod: input.paymentMethod || null,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid fee data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const status = computeStatus(data.monthlyFee, data.discount, data.paidAmount);

  const student = await db.student.findUnique({
    where: { id: data.studentId },
    select: { id: true, fullName: true, whatsapp: true, guardianName: true },
  });
  if (!student) return { ok: false as const, error: "Student not found." };

  try {
    let receiptNumber: string | undefined;
    if (data.paidAmount > 0) {
      receiptNumber = generateReceiptNumber();
    }

    const fee = await db.fee.upsert({
      where: { studentId_month: { studentId: data.studentId, month: data.month } },
      update: {
        monthlyFee: data.monthlyFee,
        discount: data.discount,
        paidAmount: data.paidAmount,
        balance: data.monthlyFee - data.discount - data.paidAmount,
        dueDate: dateOnlyUTC(data.dueDate),
        paymentDate: data.paymentDate ? dateOnlyUTC(data.paymentDate) : null,
        paymentMethod: data.paymentMethod as never,
        remarks: data.remarks || null,
        status,
        receiptNumber: data.paidAmount > 0 ? receiptNumber : undefined,
        updatedBy: user.id,
      },
      create: {
        studentId: data.studentId,
        month: data.month,
        monthlyFee: data.monthlyFee,
        discount: data.discount,
        paidAmount: data.paidAmount,
        balance: data.monthlyFee - data.discount - data.paidAmount,
        dueDate: dateOnlyUTC(data.dueDate),
        paymentDate: data.paymentDate ? dateOnlyUTC(data.paymentDate) : null,
        paymentMethod: data.paymentMethod as never,
        remarks: data.remarks || null,
        status,
        receiptNumber,
        createdBy: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      type: "FEE_RECORDED",
      action: "Fee payment recorded",
      entity: "fee",
      entityId: fee.id,
      details: `${student.fullName} — ${data.month} (${data.paidAmount} paid)`,
    });
    await createNotification({
      title: "Fee payment recorded",
      body: `${student.fullName}'s ${data.month} fee updated. Amount paid: Rs. ${data.paidAmount.toLocaleString()}.`,
    });

    revalidatePath("/fees");
    revalidatePath("/dashboard");
    revalidatePath(`/students/${data.studentId}`);
    return { ok: true as const, id: fee.id, receiptNumber: fee.receiptNumber ?? undefined };
  } catch (error) {
    console.error("Record fee failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function markFeePaidAction(studentId: string, month: string) {
  const user = await requireRole("ADMIN");
  if (!(await assertStudentAccess(user, studentId))) {
    return { ok: false as const, error: "Access denied." };
  }

  const fee = await db.fee.findUnique({
    where: { studentId_month: { studentId, month } },
  });
  if (!fee) return { ok: false as const, error: "Fee record not found." };
  if (fee.status === "PAID") return { ok: true as const };

  const paidAmount = fee.monthlyFee - fee.discount;
  const receiptNumber = paidAmount > 0 ? generateReceiptNumber() : null;

  await db.fee.update({
    where: { id: fee.id },
    data: {
      paidAmount,
      balance: 0,
      status: "PAID",
      paymentDate: new Date(),
      receiptNumber,
      updatedBy: user.id,
    },
  });
  await logActivity({
    userId: user.id,
    type: "FEE_RECORDED",
    action: "Fee marked paid",
    entity: "fee",
    entityId: fee.id,
    details: `${month} for student ${studentId}`,
  });
  revalidatePath("/fees");
  revalidatePath("/dashboard");
  return { ok: true as const, receiptNumber: receiptNumber ?? undefined };
}

export async function sendFeeReminderAction(studentId: string, month: string) {
  await requireRole("ADMIN");

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, fullName: true, whatsapp: true, guardianName: true, mobile: true },
  });
  const fee = await db.fee.findUnique({
    where: { studentId_month: { studentId, month } },
  });
  if (!student || !fee) return { ok: false as const, error: "Record not found." };

  const [year, m] = month.split("-").map(Number);
  const monthName = new Date(year, m - 1, 1).toLocaleString("en", { month: "long" });

  const message = `Dear ${student.guardianName}, this is a friendly reminder from Young Fighters Academy that the fee of Rs. ${fee.balance.toLocaleString()} for ${monthName} ${year} is pending. Please pay at your earliest convenience. Thank you!`;

  const admin = await requireRole("ADMIN");
  if (!student.whatsapp) {
    return { ok: false as const, error: "No WhatsApp number on file." };
  }

  await logActivity({
    userId: admin.id,
    type: "FEE_RECORDED",
    action: "Fee reminder sent",
    entity: "fee",
    entityId: fee.id,
    details: `${student.fullName} — ${month}`,
  });
  return { ok: true as const, message, phone: student.whatsapp };
}
