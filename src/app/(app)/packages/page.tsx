import { PackagesModule } from "@/components/packages/packages-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await requireRole("ADMIN");
  return (
    <div>
      <PageHeader
        title="Packages"
        description="Manage academy training packages that can be published on the website."
      />
      <PackagesModule />
    </div>
  );
}