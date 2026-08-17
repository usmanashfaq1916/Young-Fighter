import Image from "next/image";
import Link from "next/link";
import { verifySession, dashboardPathFor } from "@/lib/auth";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/coaches", label: "Coaches" },
  { href: "/matches", label: "Matches" },
  { href: "/contact", label: "Contact" },
] as const;

const ACADEMY_LINKS = [
  { href: "/apply", label: "Admissions" },
  { href: "/players", label: "Player Development" },
  { href: "/programs", label: "Training" },
  { href: "/players", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
] as const;

function LinkGroup({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gold-light">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={`${title}-${l.label}`}>
            <Link
              href={l.href}
              className="text-sm font-semibold text-white/70 transition hover:text-white hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function LandingFooter({ academyName }: { academyName: string }) {
  const user = await verifySession();
  const accountLinks = user
    ? [
        { href: dashboardPathFor(user.role), label: "Dashboard" },
        { href: "/profile", label: "My Profile" },
      ]
    : [{ href: "/login", label: "Login" }];

  return (
    <footer className="bg-navy py-10 text-white">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label="Young Fighters Academy — home"
              className="flex items-center gap-2 rounded-lg transition hover:opacity-90"
            >
              <Image
                src="/YFA_logo.svg"
                alt="Young Fighters Academy"
                width={34}
                height={34}
                className="rounded-md"
              />
              <p className="text-sm font-bold tracking-wide">{academyName}</p>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              Developing tomorrow&apos;s cricket champions through structured
              coaching, fitness training and real match exposure.
            </p>
          </div>
          <LinkGroup title="Quick Links" links={QUICK_LINKS} />
          <LinkGroup title="Academy" links={ACADEMY_LINKS} />
          <LinkGroup title="Account" links={accountLinks} />
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} {academyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}