import { Suspense } from "react";
import { cache } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

const getUnread = cache(async (userId: string) => {
  return db.notification.count({ where: { userId, read: false } });
});

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const unreadCount = await getUnread(user.id);

  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <AppShell title="Dashboard" user={user} unreadCount={unreadCount}>
        {children}
      </AppShell>
    </Suspense>
  );
}
