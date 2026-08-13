import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTimePK } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireRole("ADMIN");

  const logs = await db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { fullName: true, email: true } } },
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="Record of privileged operations." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="max-h-[70dvh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-alt text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {formatDateTimePK(l.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{l.user.fullName}</p>
                    <p className="text-xs text-muted">{l.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="navy">{l.type}</Badge>
                  </td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="max-w-64 truncate px-4 py-3 text-muted">{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
