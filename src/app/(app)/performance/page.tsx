import { PerformanceModule } from "@/components/performance/performance-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  await requireRole("ADMIN", "COACH");
  return (
    <div>
      <PageHeader
        title="Performance"
        description="Track student skill assessments across batting, bowling, fielding, fitness and discipline."
      />
      <PerformanceModule />
    </div>
  );
}
