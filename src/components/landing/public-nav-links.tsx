"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const PUBLIC_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/coaches", label: "Coaches" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Matches" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicNavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <>
      {PUBLIC_NAV_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isNavActive(pathname, l.href) ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition",
            isNavActive(pathname, l.href)
              ? "text-gold-light"
              : "text-white/70 hover:bg-white/10 hover:text-white",
            className
          )}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}