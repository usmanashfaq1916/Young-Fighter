import { GoalsModule } from "@/components/goals/goals-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { getGoalsData } from "@/app/actions/goals";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  await requireRole("ADMIN", "COACH");
  const data = await getGoalsData();
  return (
    <div>
      <PageHeader
        title="Development Goals"
        description="Set targets for students and track their progress over time."
      />
      <GoalsModule goals={data.goals} students={data.students} />
    </div>
  );
}