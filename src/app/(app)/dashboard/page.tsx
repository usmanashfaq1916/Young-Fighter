import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CoachDashboard } from "@/components/dashboard/coach-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("ADMIN", "COACH");
  return (
    <Suspense fallback={<CardGridSkeleton count={6} />}>
      {user.role === "ADMIN" ? <AdminDashboard user={user} /> : <CoachDashboard user={user} />}
    </Suspense>
  );
}
