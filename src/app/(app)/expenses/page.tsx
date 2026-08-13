import { ExpensesModule } from "@/components/expenses/expenses-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireRole("ADMIN");
  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track academy spending by category with live analytics."
      />
      <ExpensesModule />
    </div>
  );
}
