import Image from "next/image";
import Link from "next/link";

export function LandingFooter({ academyName }: { academyName: string }) {
  return (
    <footer className="bg-navy py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <Link
          href="/"
          aria-label="Young Fighters Academy — home"
          className="flex items-center gap-2 rounded-lg transition hover:opacity-90"
        >
          <Image
            src="/YFA_logo.svg"
            alt="Young Fighters Academy"
            width={28}
            height={28}
            className="rounded-md"
          />
          <p className="text-sm font-bold tracking-wide">{academyName}</p>
        </Link>
        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} {academyName}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="text-xs font-semibold text-white/70 transition hover:text-white hover:underline"
          >
            Contact Us
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-gold-light transition hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
