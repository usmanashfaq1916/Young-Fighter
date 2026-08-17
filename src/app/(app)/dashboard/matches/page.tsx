import { MatchesModule } from "@/components/matches/matches-module";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  await requireRole("ADMIN", "COACH");
  return (
    <div>
      <PageHeader
        title="Matches"
        description="Record fixtures, scorecards and man of the match awards."
      />
      <MatchesModule />
    </div>
  );
}
