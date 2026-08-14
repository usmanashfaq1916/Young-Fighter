import { AdmissionsModule } from "@/components/admissions/admissions-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { getAdmissionsData } from "@/app/actions/admissions";

export const dynamic = "force-dynamic";

export default async function AdmissionsAdminPage() {
  await requireRole("ADMIN");
  const data = await getAdmissionsData();
  return (
    <div>
      <PageHeader
        title="Admission Applications"
        description="Review public applications, approve and convert them into student records."
      />
      <AdmissionsModule admissions={data.admissions} />
    </div>
  );
}