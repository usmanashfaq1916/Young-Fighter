"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Gauge, Users, ClipboardCheck, Wallet, User, TrendingUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function MobileBottomNav({
  canRegister,
  role,
}: {
  canRegister: boolean;
  role?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const portalHref =
    role === "STUDENT" ? "/student" : role === "PARENT" ? "/parent" : null;

  const tabs =
    portalHref
      ? [
          { href: portalHref, label: "Home", icon: Gauge },
          { href: "/notifications", label: "Alerts", icon: Bell },
          { href: "/profile", label: "Profile", icon: User },
        ]
      : role === "COACH"
        ? [
            { href: "/dashboard", label: "Home", icon: Gauge },
            { href: "/students", label: "Students", icon: Users },
            { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
            { href: "/performance", label: "Performance", icon: TrendingUp },
            { href: "/profile", label: "Profile", icon: User },
          ]
        : [
            { href: "/dashboard", label: "Home", icon: Gauge },
            { href: "/students", label: "Students", icon: Users },
            { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
            { href: "/fees", label: "Fees", icon: Wallet },
            { href: "/profile", label: "Profile", icon: User },
          ];

  const isActive = (href: string) =>
    href === portalHref || href === "/dashboard"
      ? pathname === href || pathname.startsWith("/coach/")
      : pathname.startsWith(href);

  return (
    <>
      {canRegister && (
        <button
          onClick={() => router.push("/students/new")}
          aria-label="Register student"
          className="fixed bottom-16 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold text-navy shadow-xl transition active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition",
              isActive(tab.href)
                ? "text-primary"
                : "text-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
