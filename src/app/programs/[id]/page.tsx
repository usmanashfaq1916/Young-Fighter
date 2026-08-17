import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowRight, CalendarDays, ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME, billingTypeLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pkg = await db.package.findFirst({ where: { id, isActive: true } });
  return {
    title: pkg ? pkg.name : "Program Not Found",
    description: pkg?.description ?? undefined,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await db.package.findFirst({
    where: { id, isActive: true },
  });
  if (!pkg) notFound();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs current={pkg.name} />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            All programs
          </Link>
          <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            {pkg.name}
          </h1>
          {pkg.description && (
            <p className="mt-4 max-w-xl text-white/75">{pkg.description}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="card h-fit p-6 md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Price
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-primary">
              {formatMoney(pkg.price)}
              <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted">
                / {billingTypeLabel[pkg.billingType].toLowerCase()}
              </span>
            </p>
            {pkg.sessionsPerWeek > 0 && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-gold-dark" />
                {pkg.sessionsPerWeek} sessions per week
              </p>
            )}
            <Link href="/apply" className="btn-gold mt-6 w-full justify-center">
              Apply for this program
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="btn-outline-dark mt-3 w-full justify-center">
              Ask a question
            </Link>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-2xl font-black tracking-tight">
              What&apos;s included
            </h2>
            {pkg.features.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                    <span className="text-sm font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-muted">
                Program details are confirmed with your batch placement.
              </p>
            )}
            <div className="card mt-8 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
                How to join
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Submit an application online, attend a trial session so coaches
                can assess level and needs, and we will confirm the right batch,
                schedule and program for your child.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}