import "server-only";
import { db } from "@/lib/db";
import { sendWebPush } from "@/lib/push";
import type { Role } from "@/generated/prisma/client";

type NotifyInput = {
  title: string;
  body: string;
  type?: string;
  userId?: string;
  role?: Role;
};

export async function createNotification(input: NotifyInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        title: input.title,
        body: input.body,
        type: input.type ?? "info",
        userId: input.userId,
        role: input.role,
      },
    });
    if (input.userId) {
      await sendWebPush(input.userId, { title: input.title, body: input.body });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyUsers(
  roleOrIds: Role | string[],
  input: Omit<NotifyInput, "role" | "userId">
): Promise<number> {
  try {
    let users: { id: string }[];
    if (Array.isArray(roleOrIds)) {
      users = roleOrIds.map((id) => ({ id }));
    } else {
      users = await db.user.findMany({
        where: { role: roleOrIds, status: "ACTIVE" },
        select: { id: true },
      });
    }
    if (users.length === 0) return 0;
    await db.notification.createMany({
      data: users.map((u) => ({
        title: input.title,
        body: input.body,
        type: input.type ?? "info",
        userId: u.id,
      })),
    });
    for (const u of users) {
      await sendWebPush(u.id, { title: input.title, body: input.body });
    }
    return users.length;
  } catch (error) {
    console.error("Failed to notify users:", error);
    return 0;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, read: false },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
