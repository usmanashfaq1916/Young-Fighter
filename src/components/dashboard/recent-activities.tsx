"use client";

import { Activity as ActivityIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { roleLabel } from "@/lib/constants";
import { formatDateTimePK } from "@/lib/utils";

export function RecentActivities({
  activities,
}: {
  activities: {
    id: string;
    type: string;
    action: string;
    details: string | null;
    createdAt: Date;
    user: { fullName: string; role: string };
  }[];
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Recent Activities</h3>
          <p className="text-xs text-muted">Latest system activity</p>
        </div>
        <ActivityIcon className="h-5 w-5 text-muted" />
      </div>
      <ul className="divide-y divide-border">
        {activities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-5 py-3">
            <Avatar name={a.user.fullName} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{a.user.fullName}</span>{" "}
                <span className="text-muted">{a.action}</span>
              </p>
              {a.details && (
                <p className="mt-0.5 truncate text-xs text-muted">{a.details}</p>
              )}
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDateTimePK(a.createdAt)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
              {roleLabel[a.user.role]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}