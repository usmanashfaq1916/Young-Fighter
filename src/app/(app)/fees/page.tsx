import { FeesModule } from "@/components/fees/fees-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const settings = await db.setting.findMany();
  const receiptFooter = settings.find((s) => s.key === "receiptFooter")?.value ?? "";

  return (
    <div>
      <PageHeader
        title="Fees & Payments"
        description="Record fee payments, generate receipts and send WhatsApp reminders."
      />
      <FeesModule initialMonth={month} receiptFooter={receiptFooter} />
    </div>
  );
}