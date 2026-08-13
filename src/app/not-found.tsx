import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark dark:text-gold-light">
        <SearchX className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-black text-foreground">404 — Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button>
          <Home className="h-4 w-4" /> Go home
        </Button>
      </Link>
    </div>
  );
}