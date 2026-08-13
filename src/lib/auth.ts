import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptSession, getSessionToken, updateSessionExpiry } from "@/lib/session";
import type { Role, User } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  mobile: string | null;
  photoUrl: string | null;
  studentId: string | null;
};

export const verifySession = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  const payload = await decryptSession(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      mobile: true,
      photoUrl: true,
      studentId: true,
      status: true,
      sessionVersion: true,
    },
  });

  if (!user || user.status !== "ACTIVE") return null;

  // Session revoked (password change / logout all devices)
  if (user.sessionVersion !== payload.sessionVersion) return null;

  // Slide expiry
  void updateSessionExpiry(payload).catch(() => {});

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    mobile: user.mobile,
    photoUrl: user.photoUrl,
    studentId: user.studentId,
  };
});

export async function requireAuth(): Promise<SessionUser> {
  const user = await verifySession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export const dashboardPathFor = (role: Role) => {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "COACH":
      return "/coach";
    case "STUDENT":
      return "/student";
    case "PARENT":
      return "/parent";
  }
};

export function getCurrentUserFromDb(): User | null {
  return null;
}
