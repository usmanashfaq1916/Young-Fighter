"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Bell,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/actions/auth";
import { useEffect, useSyncExternalStore } from "react";

export function Topbar({
  title,
  user,
  unreadCount,
  onMenuClick,
  onSearchClick,
}: {
  title: string;
  user: { fullName: string; role: string; photoUrl?: string | null };
  unreadCount: number;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-black tracking-tight text-foreground">
        {title}
      </h1>

      {onSearchClick && (
        <button
          onClick={onSearchClick}
          aria-label="Search students"
          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt lg:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-muted transition hover:bg-surface-alt"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
          }
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : theme === "light" ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-surface-alt"
        >
          <Avatar src={user.photoUrl} name={user.fullName} size={34} />
          <span className="hidden text-left md:block">
            <span className="block max-w-28 truncate text-xs font-bold text-foreground">
              {user.fullName}
            </span>
            <span className="block text-[10px] uppercase tracking-wide text-muted">
              {user.role}
            </span>
          </span>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-bold text-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted">{user.role}</p>
            </div>
            <Link
              href="/profile"
              role="menuitem"
              className="block px-4 py-2.5 text-sm text-foreground transition hover:bg-surface-alt"
            >
              My Profile
            </Link>
            <button
              role="menuitem"
              onClick={async () => {
                setBusy(true);
                await signOut();
              }}
              disabled={busy}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
