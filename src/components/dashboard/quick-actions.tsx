import { ClipboardCheck, Wallet, TrendingUp, Trophy, Receipt, FileBarChart, UserPlus } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  { href: "/students/new", label: "Register Student", icon: UserPlus },
  { href: "/attendance", label: "Mark Attendance", icon: ClipboardCheck },
  { href: "/fees", label: "Record Fee", icon: Wallet },
  { href: "/performance", label: "Add Performance", icon: TrendingUp },
  { href: "/dashboard/matches", label: "Add Match", icon: Trophy },
  { href: "/expenses", label: "Add Expense", icon: Receipt },
  { href: "/reports", label: "Generate Report", icon: FileBarChart },
];

export function QuickActions() {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center transition hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <a.icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-semibold text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}