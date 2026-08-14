import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/apply", label: "Apply Now", key: "apply" },
  { href: "/contact", label: "Contact Us", key: "contact" },
] as const;

export function LandingHeader({ active }: { active?: "home" | "apply" | "contact" }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href="/"
          aria-label="Young Fighters Academy — home"
          className="flex items-center gap-3 rounded-lg transition hover:opacity-90"
        >
          <Image
            src="/YFA_logo.svg"
            alt="Young Fighters Academy"
            width={42}
            height={42}
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
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                active === l.key
                  ? "text-gold-light"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" className="btn-gold">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <nav
        className="flex items-center justify-center gap-1 border-t border-white/10 px-5 py-2 sm:hidden"
        aria-label="Main"
      >
        {NAV_LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition",
              active === l.key
                ? "text-gold-light"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
