import { FeesModule } from "@/components/fees/fees-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <PageHeader
        title="Fees & Payments"
        description="Record fee payments, generate receipts and send WhatsApp reminders."
      />
      <FeesModule initialMonth={month} />
    </div>
  );
}