import {
  Users,
  UserCheck,
  UserX,
  ClipboardCheck,
  Wallet,
  AlertCircle,
  TrendingUp,
  Receipt,
  Percent,
  GraduationCap,
  UsersRound,
  CalendarClock,
  BadgeDollarSign,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  StudentGrowthChart,
  AttendanceTrendChart,
  FeeCollectionChart,
  ProfitChart,
  PaymentMethodsPie,
  SkillDistributionChart,
  BatchDistributionChart,
} from "@/components/dashboard/charts";
import { TopPlayers } from "@/components/dashboard/top-players";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { UpcomingDues } from "@/components/dashboard/upcoming-dues";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import type { DashboardFilters as Filters } from "@/lib/dashboard";
import {
  getDashboardStats,
  getMonthlySeries,
  getTopPlayers,
  getUpcomingDues,
  getPaymentMethodBreakdown,
  getSkillDistribution,
  getBatchDistribution,
} from "@/lib/dashboard";
import { listRecentActivities } from "@/lib/activity";
import { formatMoney } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export async function AdminDashboard({
  user,
  filters = {},
  filterOptions,
}: {
  user: SessionUser;
  filters?: Filters;
  filterOptions: { batches: { id: string; name: string }[]; coaches: { id: string; fullName: string }[] };
}) {
  const today = new Date();
  const [stats, series, topPlayers, activities, dues, paymentMethods, skills, batches] =
    await Promise.all([
      getDashboardStats(user, today, filters),
      getMonthlySeries(user, 6, filters),
      getTopPlayers(user, 5),
      listRecentActivities(12),
      getUpcomingDues(user, 10),
      getPaymentMethodBreakdown(user),
      getSkillDistribution(user, filters),
      getBatchDistribution(user, filters),
    ]);

  return (
    <div className="space-y-6">
      <DashboardFilters
        batches={filterOptions.batches}
        coaches={filterOptions.coaches}
        current={{
          month: filters.month,
          batchId: filters.batchId,
          coachId: filters.coachId,
          studentStatus: filters.studentStatus,
        }}
      />

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
          label="Inactive Students"
          value={stats.inactiveStudents}
          icon={<UserX className="h-5 w-5" />}
          tone="red"
        />
        <StatCard
          label="Coaches"
          value={stats.coachesCount}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Active Batches"
          value={stats.batchesCount}
          icon={<UsersRound className="h-5 w-5" />}
          tone="navy"
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
          label="Upcoming Matches"
          value={stats.upcomingMatches}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="blue"
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
          label="Overdue Fees"
          value={formatMoney(stats.overdueFees)}
          sub={stats.overdueFeeCount > 0 ? `${stats.overdueFeeCount} students` : undefined}
          icon={<BadgeDollarSign className="h-5 w-5" />}
          tone={stats.overdueFees > 0 ? "red" : "green"}
        />
        <StatCard
          label="Monthly Income"
          value={formatMoney(stats.monthlyIncome)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatMoney(stats.monthlyExpenses)}
          icon={<Wallet className="h-5 w-5" />}
          tone="gold"
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
        <SkillDistributionChart data={skills} />
        <BatchDistributionChart data={batches} />
        <PaymentMethodsPie data={paymentMethods} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FeeCollectionChart data={series} />
        <ProfitChart data={series} />
        <div className="lg:col-span-1" />
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