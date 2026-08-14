import { TrainingModule } from "@/components/training/training-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { getTrainingData } from "@/app/actions/training";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  await requireRole("ADMIN", "COACH");
  const data = await getTrainingData();
  return (
    <div>
      <PageHeader
        title="Training Sessions"
        description="Plan drills, record attendance and capture coach notes for every session."
      />
      <TrainingModule
        sessions={data.sessions}
        batches={data.batches}
        coaches={data.coaches}
        students={data.students}
        today={data.today}
      />
    </div>
  );
}