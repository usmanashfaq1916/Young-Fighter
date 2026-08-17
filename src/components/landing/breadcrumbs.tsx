"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  about: "About",
  programs: "Programs",
  coaches: "Coaches",
  players: "Players",
  matches: "Matches",
  gallery: "Gallery",
  contact: "Contact",
  apply: "Admissions",
};

export function Breadcrumbs({ current }: { current?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: SEGMENT_LABELS[seg] ?? seg });
  }

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-5 pt-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-muted transition hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          const label = current && isLast ? current : c.label;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {label}
                </span>
              ) : (
                <Link href={c.href} className="text-muted transition hover:text-primary">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}