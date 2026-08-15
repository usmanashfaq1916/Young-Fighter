import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CoachDashboard } from "@/components/dashboard/coach-dashboard";
import { getFilterOptions } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; batch?: string; coach?: string; status?: string }>;
}) {
  const user = await requireRole("ADMIN", "COACH");
  const params = await searchParams;

  if (user.role === "COACH") {
    return (
      <Suspense fallback={<CardGridSkeleton count={6} />}>
        <CoachDashboard user={user} />
      </Suspense>
    );
  }

  const filterOptions = await getFilterOptions(user);
  const filters = {
    month: params.month,
    batchId: params.batch,
    coachId: params.coach,
    studentStatus: params.status,
  };

  return (
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      <AdminDashboard
        user={user}
        filters={filters}
        filterOptions={filterOptions}
      />
    </Suspense>
  );
}