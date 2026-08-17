"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { PUBLIC_NAV_LINKS, isNavActive } from "./public-nav-links";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu({
  loggedIn,
  dashboardHref,
}: {
  loggedIn: boolean;
  dashboardHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white xl:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Main menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <nav
            aria-label="Main"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto bg-navy p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black tracking-wide text-gold-light">YOUNG FIGHTERS</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {PUBLIC_NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isNavActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  isNavActive(pathname, l.href)
                    ? "bg-white/10 text-gold-light"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <Link href="/apply" onClick={() => setOpen(false)} className="btn-gold w-full justify-center">
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              {loggedIn && dashboardHref ? (
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="btn-outline-light w-full justify-center">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline-light w-full justify-center">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}