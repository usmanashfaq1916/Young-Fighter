import { RankingsModule } from "@/components/rankings/rankings-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/auth";
import { getCareerStats } from "@/lib/career-stats";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "COACH") return null;

  const stats = await getCareerStats(user);

  return (
    <div>
      <PageHeader
        title="Rankings"
        description="Career leaderboards for runs, wickets, fielding and match awards."
      />
      <RankingsModule stats={stats} />
    </div>
  );
}