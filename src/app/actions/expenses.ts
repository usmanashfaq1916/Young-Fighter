"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { dateOnlyUTC } from "@/lib/utils";

export type ExpenseActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function addExpenseAction(input: {
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}) {
  const user = await requireRole("ADMIN");

  const parsed = expenseSchema.safeParse({
    ...input,
    date: input.date ? new Date(input.date) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid expense data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    const expense = await db.expense.create({
      data: {
        title: data.title,
        category: data.category as never,
        amount: data.amount,
        date: dateOnlyUTC(data.date),
        notes: data.notes || null,
        createdBy: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      type: "EXPENSE_ADDED",
      action: "Expense added",
      entity: "expense",
      entityId: expense.id,
      details: `${data.title} (Rs. ${data.amount.toLocaleString()})`,
    });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true as const, id: expense.id };
  } catch (error) {
    console.error("Add expense failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updateExpenseAction(
  id: string,
  input: {
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }
) {
  const user = await requireRole("ADMIN");
  const parsed = expenseSchema.safeParse({
    ...input,
    date: input.date ? new Date(input.date) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid expense data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Expense not found." };

  await db.expense.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category as never,
      amount: data.amount,
      date: dateOnlyUTC(data.date),
      notes: data.notes || null,
    },
  });
  await logActivity({
    userId: user.id,
    type: "EXPENSE_UPDATED",
    action: "Expense updated",
    entity: "expense",
    entityId: id,
    details: data.title,
  });
  revalidatePath("/expenses");
  return { ok: true as const };
}

export async function deleteExpenseAction(id: string) {
  const user = await requireRole("ADMIN");
  const expense = await db.expense.findUnique({ where: { id } });
  if (!expense) return { ok: false as const, error: "Expense not found." };

  await db.expense.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    type: "EXPENSE_DELETED",
    action: "Expense deleted",
    entity: "expense",
    entityId: id,
    details: expense.title,
  });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
