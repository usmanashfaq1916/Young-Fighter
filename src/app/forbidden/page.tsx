import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifySession, dashboardPathFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Access Denied" };

export default async function ForbiddenPage() {
  const user = await verifySession();
  const href = user ? dashboardPathFor(user.role) : "/login";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-foreground">Access Denied</h1>
      <p className="max-w-sm text-sm text-muted">
        You do not have permission to view this page. If you believe this is a
        mistake, contact the academy administrator.
      </p>
      <Link href={href}>
        <Button>{user ? "Go to Dashboard" : "Go to Login"}</Button>
      </Link>
    </div>
  );
}