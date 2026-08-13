import { db } from "@/lib/db";
import type { Role, StudentStatus, Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth";

/**
 * Centralized data isolation: every query that touches student-scoped data
 * must be constrained by the caller's role. These helpers return the base
 * `where` clause for the current user so that admins see everything,
 * coaches see only their assigned students, parents only their linked
 * children, and students only their own record.
 */
export function studentScopeWhere(
  user: SessionUser
): Prisma.StudentWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "COACH":
      return { coachId: user.id };
    case "PARENT":
      return { parentLinks: { some: { parentId: user.id } } };
    case "STUDENT":
      return user.studentId ? { id: user.studentId } : { id: "__none__" };
  }
}

export function activeStudentsWhere(
  user: SessionUser
): Prisma.StudentWhereInput {
  return { ...studentScopeWhere(user), status: "ACTIVE", deletedAt: null };
}

export function canManageStudent(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.role === "COACH";
}

export function canManageFinance(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export async function studentIdsInScope(user: SessionUser): Promise<string[]> {
  const students = await db.student.findMany({
    where: studentScopeWhere(user),
    select: { id: true },
  });
  return students.map((s) => s.id);
}

export async function assertStudentAccess(
  user: SessionUser,
  studentId: string
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const count = await db.student.count({
    where: { ...studentScopeWhere(user), id: studentId },
  });
  return count > 0;
}

/**
 * Match-level scope: admins see all matches; coaches see only matches they
 * created/coach or that contain a record for one of their assigned students.
 */
export function matchScopeWhere(user: SessionUser): Prisma.MatchWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "COACH":
      return {
        OR: [
          { coachId: user.id },
          {
            records: {
              some: { student: { coachId: user.id, deletedAt: null } },
            },
          },
        ],
      };
    default:
      // STUDENT/PARENT never access match management surfaces.
      return { id: "__none__" };
  }
}

export type { Role, StudentStatus };
