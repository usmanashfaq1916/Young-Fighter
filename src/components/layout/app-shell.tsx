"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar, navItems } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { GlobalSearch } from "@/components/layout/global-search";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function AppShell({
  title,
  user,
  unreadCount,
  children,
}: {
  title: string;
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const canRegister = user.role === "ADMIN" || user.role === "COACH";

  // Role-aware navigation (UX only; authorization is enforced server-side).
  const portalHref =
    user.role === "STUDENT" ? "/student" : user.role === "PARENT" ? "/parent" : null;

  const visibleNavItems =
    portalHref
      ? navItems
          .filter((i) => ["/dashboard", "/notifications", "/profile"].includes(i.href))
          .map((i) =>
            i.href === "/dashboard" ? { ...i, href: portalHref } : i
          )
      : user.role === "COACH"
        ? navItems.filter((i) =>
            [
              "/dashboard",
              "/students",
              "/attendance",
              "/performance",
              "/matches",
              "/scan",
              "/reports",
              "/notifications",
              "/profile",
            ].includes(i.href)
          )
        : navItems;

  const isActive = (item: (typeof navItems)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-dvh">
      <Sidebar user={user} items={visibleNavItems} />
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="flex h-full w-72 flex-col bg-navy text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/YFA_logo.svg"
                  alt="Young Fighters Academy"
                  width={36}
                  height={36}
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
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
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
          </div>
        </div>
      )}
      <div className="lg:pl-64">
        <Topbar
          title={title}
          user={user}
          unreadCount={unreadCount}
          onMenuClick={() => setDrawerOpen(true)}
          onSearchClick={canRegister ? () => setSearchOpen(true) : undefined}
        />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 md:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav canRegister={canRegister} role={user.role} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
