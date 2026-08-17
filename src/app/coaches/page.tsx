import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coaches",
  description:
    "Meet the coaching team at Young Fighters Academy — experienced coaches guiding young cricketers through structured training.",
};

export default async function CoachesPage() {
  const coaches = await db.user.findMany({
    where: { role: "COACH", status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      photoUrl: true,
      coachProfile: { select: { specialization: true } },
      batches: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Meet the team
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Our Coaches
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Experienced, patient and committed to developing every young player
            — technique, fitness and character.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {coaches.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((c) => (
              <div key={c.id} className="card flex flex-col items-center p-6 text-center">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoUrl}
                    alt={c.fullName}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-lg font-black text-gold-light">
                    {initials(c.fullName)}
                  </div>
                )}
                <h2 className="mt-4 text-lg font-black">{c.fullName}</h2>
                {c.coachProfile?.specialization && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold-dark dark:text-gold-light">
                    {c.coachProfile.specialization}
                  </p>
                )}
                {c.batches.length > 0 && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5 text-gold-dark" />
                    {c.batches.map((b) => b.name).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted">
              Coach profiles are being prepared. Contact us to learn more about
              our coaching team.
            </p>
            <Link href="/contact" className="btn-gold mt-5">
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}