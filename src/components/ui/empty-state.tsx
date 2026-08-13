import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-muted">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <div>
        <p className="text-base font-bold text-foreground">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
