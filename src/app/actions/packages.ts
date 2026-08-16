"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { packageSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { dateOnlyUTC } from "@/lib/utils";

export type PackageActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type PackageInput = {
  name: string;
  description?: string;
  price: number;
  billingType: string;
  sessionsPerWeek?: number;
  features?: string[];
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

export async function createPackageAction(input: PackageInput) {
  const user = await requireRole("ADMIN");
  const parsed = packageSchema.safeParse({
    ...input,
    billingType: input.billingType || "MONTHLY",
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid package data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    const pkg = await db.package.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        price: data.price,
        billingType: data.billingType as never,
        sessionsPerWeek: data.sessionsPerWeek,
        features: data.features,
        startDate: data.startDate ? dateOnlyUTC(data.startDate) : null,
        endDate: data.endDate ? dateOnlyUTC(data.endDate) : null,
        isActive: data.isActive,
        createdBy: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      type: "PACKAGE_CREATED",
      action: "Package created",
      entity: "package",
      entityId: pkg.id,
      details: `${data.name} (Rs. ${data.price.toLocaleString()})`,
    });
    revalidatePath("/packages");
    revalidatePath("/");
    return { ok: true as const, id: pkg.id };
  } catch (error) {
    console.error("Create package failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updatePackageAction(id: string, input: PackageInput) {
  const user = await requireRole("ADMIN");
  const parsed = packageSchema.safeParse({
    ...input,
    billingType: input.billingType || "MONTHLY",
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid package data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const existing = await db.package.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Package not found." };

  await db.package.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description || null,
      price: data.price,
      billingType: data.billingType as never,
      sessionsPerWeek: data.sessionsPerWeek,
      features: data.features,
      startDate: data.startDate ? dateOnlyUTC(data.startDate) : null,
      endDate: data.endDate ? dateOnlyUTC(data.endDate) : null,
      isActive: data.isActive,
    },
  });
  await logActivity({
    userId: user.id,
    type: "PACKAGE_UPDATED",
    action: "Package updated",
    entity: "package",
    entityId: id,
    details: data.name,
  });
  revalidatePath("/packages");
  revalidatePath("/");
  return { ok: true as const };
}

export async function togglePackageAction(id: string) {
  const user = await requireRole("ADMIN");
  const pkg = await db.package.findUnique({ where: { id } });
  if (!pkg) return { ok: false as const, error: "Package not found." };

  await db.package.update({
    where: { id },
    data: { isActive: !pkg.isActive },
  });
  await logActivity({
    userId: user.id,
    type: "PACKAGE_UPDATED",
    action: pkg.isActive ? "Package deactivated" : "Package activated",
    entity: "package",
    entityId: id,
    details: pkg.name,
  });
  revalidatePath("/packages");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deletePackageAction(id: string) {
  const user = await requireRole("ADMIN");
  const pkg = await db.package.findUnique({ where: { id } });
  if (!pkg) return { ok: false as const, error: "Package not found." };

  await db.package.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    type: "PACKAGE_DELETED",
    action: "Package deleted",
    entity: "package",
    entityId: id,
    details: pkg.name,
  });
  revalidatePath("/packages");
  revalidatePath("/");
  return { ok: true as const };
}