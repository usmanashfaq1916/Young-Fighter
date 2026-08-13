"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  TrendingUp,
  Trophy,
  Receipt,
  FileBarChart,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Gauge,
  ScanLine,
  UserCog,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useState } from "react";
import Image from "next/image";
import type { SessionUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, exact: true },
  { href: "/students", label: "Students", icon: Users },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/matches", label: "Matches", icon: Trophy },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/scan", label: "Scan QR", icon: ScanLine },
  { href: "/coaches", label: "Coaches", icon: GraduationCap },
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit-logs", label: "Audit Logs", icon: History },
];

export function Sidebar({
  user,
  items = navItems,
}: {
  user: SessionUser;
  items?: NavItem[];
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy text-white lg:flex">
      <Link
        href="/"
        aria-label="Young Fighters Academy — home"
        className="flex items-center gap-3 px-5 py-5 transition hover:opacity-90"
      >
        <Image
          src="/YFA_logo.svg"
          alt="Young Fighters Academy"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div>
          <p className="text-sm font-black tracking-wide text-gold-light">
            YOUNG FIGHTERS
          </p>
          <p className="text-[10px] uppercase tracking-widest text-white/60">
            Cricket Academy
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              isActive(item)
                ? "bg-primary text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="truncate text-[11px] text-white/60">{user.role}</p>
          </div>
          <button
            onClick={async () => {
              setBusy(true);
              await signOut();
            }}
            disabled={busy}
            aria-label="Log out"
            className="rounded-lg p-2 text-white/60 transition hover:bg-danger/20 hover:text-white"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
