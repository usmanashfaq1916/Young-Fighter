import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  tone = "green",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  tone?: "green" | "gold" | "navy" | "red" | "blue";
}) {
  const tones = {
    green: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold-dark dark:text-gold-light",
    navy: "bg-navy/10 text-navy dark:text-gold-light",
    red: "bg-danger/10 text-danger",
    blue: "bg-info/10 text-info",
  };

  return (
    <div className="card flex items-start justify-between gap-3 p-4 md:p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-1.5 truncate text-xl font-black text-foreground md:text-2xl">
          {value}
        </p>
        {trend !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold",
                trend >= 0 ? "text-success" : "text-danger"
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-[11px] text-muted">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
      {icon && (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tones[tone]
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
