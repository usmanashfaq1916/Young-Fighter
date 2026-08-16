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

  const packages = await db.package.findMany({
    where: { isActive: true },
    select: { id: true, name: true, price: true, billingType: true },
    orderBy: { price: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Fees & Payments"
        description="Record fee payments, generate receipts and send WhatsApp reminders."
      />
      <FeesModule initialMonth={month} receiptFooter={receiptFooter} packages={packages} />
    </div>
  );
}