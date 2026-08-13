import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ProfileClient } from "@/components/profile/profile-client";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT");

  const [dbUser, linkedStudent, parentLinks] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { email: true, fullName: true, mobile: true, role: true, createdAt: true },
    }),
    user.studentId
      ? db.student.findUnique({
          where: { id: user.studentId },
          select: { fullName: true, studentId: true, photoUrl: true, batch: { select: { name: true } } },
        })
      : null,
    user.role === "PARENT"
      ? db.studentParent.findMany({
          where: { parentId: user.id },
          select: { student: { select: { id: true, fullName: true, studentId: true } } },
        })
      : [],
  ]);

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and security." />
      <ProfileClient
        user={JSON.parse(JSON.stringify(dbUser))}
        student={JSON.parse(JSON.stringify(linkedStudent))}
        linkedChildren={JSON.parse(JSON.stringify(parentLinks.map((l) => l.student)))}
      />
    </div>
  );
}