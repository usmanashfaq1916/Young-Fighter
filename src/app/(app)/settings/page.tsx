import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/settings-client";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole("ADMIN");

  const [batches, coaches, settings] = await Promise.all([
    db.batch.findMany({
      include: {
        coach: { select: { fullName: true } },
        _count: { select: { students: true } },
        students: {
          where: { deletedAt: null },
          select: { id: true, fullName: true, studentId: true, status: true },
          orderBy: { fullName: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    user.role === "ADMIN"
      ? db.user.findMany({ where: { role: "COACH" }, select: { id: true, fullName: true } })
      : [],
    db.setting.findMany(),
  ]);

  const settingMap: Record<string, string> = {};
  for (const s of settings) settingMap[s.key] = s.value;

  return (
    <div>
      <PageHeader title="Settings" description="Academy information and batch management." />
      <SettingsClient
        user={JSON.parse(JSON.stringify(user))}
        batches={JSON.parse(JSON.stringify(batches))}
        coaches={JSON.parse(JSON.stringify(coaches))}
        initial={settingMap}
      />
    </div>
  );
}