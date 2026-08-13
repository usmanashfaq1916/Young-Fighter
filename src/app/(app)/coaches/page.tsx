import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CoachesList } from "@/components/coaches/coaches-list";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function CoachesPage() {
  const user = await requireRole("ADMIN");

  const coaches = await db.user.findMany({
    where: { role: "COACH" },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      status: true,
      createdAt: true,
      coachProfile: { select: { specialization: true } },
      coachStudents: { where: { deletedAt: null }, select: { id: true } },
      batches: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Coaches"
        description="Coaching staff and their assigned students."
      />
      <CoachesList
        user={JSON.parse(JSON.stringify(user))}
        coaches={JSON.parse(JSON.stringify(coaches))}
      />
    </div>
  );
}