import {
  Users,
  UserCheck,
  ClipboardCheck,
  Wallet,
  AlertCircle,
  TrendingUp,
  Receipt,
  Percent,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  StudentGrowthChart,
  AttendanceTrendChart,
  FeeCollectionChart,
  ProfitChart,
  PaymentMethodsPie,
} from "@/components/dashboard/charts";
import { TopPlayers } from "@/components/dashboard/top-players";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { UpcomingDues } from "@/components/dashboard/upcoming-dues";
import { QuickActions } from "@/components/dashboard/quick-actions";
import {
  getDashboardStats,
  getMonthlySeries,
  getTopPlayers,
  getUpcomingDues,
  getPaymentMethodBreakdown,
} from "@/lib/dashboard";
import { listRecentActivities } from "@/lib/activity";
import { formatMoney } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export async function AdminDashboard({ user }: { user: SessionUser }) {
  const today = new Date();
  const [stats, series, topPlayers, activities, dues, paymentMethods] =
    await Promise.all([
      getDashboardStats(user, today),
      getMonthlySeries(user, 6),
      getTopPlayers(user, 5),
      listRecentActivities(12),
      getUpcomingDues(user, 10),
      getPaymentMethodBreakdown(user),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active Students"
          value={stats.activeStudents}
          icon={<UserCheck className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Today's Attendance"
          value={`${stats.todayAttendance.present}/${stats.todayAttendance.total}`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Attendance %"
          value={`${stats.attendancePct}%`}
          icon={<Percent className="h-5 w-5" />}
          tone="navy"
        />
        <StatCard
          label="Fee Collected"
          value={formatMoney(stats.feeCollected)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Fees"
          value={formatMoney(stats.pendingFees)}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="red"
        />
        <StatCard
          label="Monthly Income"
          value={formatMoney(stats.monthlyIncome)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Net Profit"
          value={formatMoney(stats.netProfit)}
          icon={<Receipt className="h-5 w-5" />}
          tone={stats.netProfit >= 0 ? "green" : "red"}
        />
      </div>

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudentGrowthChart data={series} />
        </div>
        <AttendanceTrendChart data={series} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FeeCollectionChart data={series} />
        <ProfitChart data={series} />
        <PaymentMethodsPie data={paymentMethods} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingDues dues={dues} />
        </div>
        <TopPlayers players={topPlayers} />
      </div>

      <RecentActivities activities={activities} />
    </div>
  );
}