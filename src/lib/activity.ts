import "server-only";
import { db } from "@/lib/db";
import type { ActivityType } from "@/generated/prisma/client";

type ActivityInput = {
  userId: string;
  type: ActivityType;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
};

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await db.activity.create({ data: input });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

export async function listRecentActivities(limit = 20) {
  return db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { fullName: true, role: true } } },
  });
}
