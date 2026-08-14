import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ACADEMY_NAME } from "@/lib/constants";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { AdmissionsApply } from "@/components/admissions/admissions-apply";
import { ClipboardList, CalendarDays, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Apply for admission to Young Fighters Academy. Submit your application online and start your cricket journey with professional coaching.",
};

export default async function AdmissionsPage() {
  const batches = await db.batch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader active="apply" />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Admissions open
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Apply for Admission to {ACADEMY_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Submit an application for your child and our coaching team will
            review it and contact you with the next steps.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">1. Submit application</h2>
            <p className="mt-2 text-sm text-muted">
              Fill in the form below with your child&apos;s details and cricket
              experience.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">2. Trial &amp; review</h2>
            <p className="mt-2 text-sm text-muted">
              We invite the player for a short assessment and share the result
              with you.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">3. Join the academy</h2>
            <p className="mt-2 text-sm text-muted">
              Approved players are registered, assigned a batch and given their
              official Student ID.
            </p>
          </div>
        </div>

        <div className="mt-14">
          <AdmissionsApply batches={batches} />
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}