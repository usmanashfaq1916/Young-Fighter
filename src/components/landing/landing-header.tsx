import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { verifySession, dashboardPathFor } from "@/lib/auth";
import { PublicNavLinks } from "./public-nav-links";
import { MobileMenu } from "./mobile-menu";

export async function LandingHeader() {
  const user = await verifySession();
  const dashboardHref = user ? dashboardPathFor(user.role) : undefined;

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
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          <PublicNavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <MobileMenu loggedIn={!!user} dashboardHref={dashboardHref} />
          {user ? (
            <Link href={dashboardHref!} className="btn-gold !px-4">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-gold">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}