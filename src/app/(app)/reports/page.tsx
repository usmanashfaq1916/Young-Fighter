import { ReportsModule } from "@/components/reports/reports-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireRole("ADMIN", "COACH");
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate student, financial and match reports with Excel and PDF exports."
      />
      <ReportsModule role={user.role} />
    </div>
  );
}
