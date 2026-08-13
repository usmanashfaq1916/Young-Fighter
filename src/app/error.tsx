"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-black text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error occurred. You can try again or head back to the dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline">
            <Home className="h-4 w-4" /> Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}