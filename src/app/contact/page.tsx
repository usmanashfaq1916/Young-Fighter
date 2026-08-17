import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME } from "@/lib/constants";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { WhatsAppIcon } from "@/components/landing/whatsapp-icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Young Fighters Academy — call, email, WhatsApp or visit us for admissions, schedules and fees.",
};

const CONTACT_PHONE = "+92 3325 4221555";
const WHATSAPP_LINK =
  "https://wa.me/9233254221555?text=Hello%20Young%20Fighters%20Academy!%20I%27d%20like%20to%20know%20more.";

export default async function ContactPage() {
  const [settings, batches] = await Promise.all([
    db.setting.findMany(),
    db.batch.findMany({
      where: { isActive: true },
      select: {
        name: true,
        trainingDays: true,
        trainingTime: true,
        trainingLocation: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const settingMap: Record<string, string> = {};
  for (const s of settings) settingMap[s.key] = s.value;

  const academyName = settingMap.academyName || ACADEMY_NAME;
  const phone = settingMap.academyPhone || CONTACT_PHONE;
  const email = settingMap.academyEmail || "info@youngfighters.com.pk";
  const address = settingMap.academyAddress || "City Ground, Pakistan";
  const academyHours = settingMap.academyHours || "Mon–Sat, 9:00am – 8:00pm";
  const scheduledBatches = batches.filter(
    (b) => b.trainingDays || b.trainingTime || b.trainingLocation
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Contact us
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Get in touch with {academyName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Questions about admissions, schedules or fees? Call, message or visit
            us — we&apos;re happy to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <Phone className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">Call us</h2>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="mt-1.5 block text-sm font-semibold hover:underline"
            >
              {phone}
            </a>
            <p className="mt-1 text-xs text-muted">{academyHours}</p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success text-white">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">WhatsApp</h2>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-success hover:underline"
            >
              Chat with us
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-1 text-xs text-muted">Fastest response for admissions</p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">Email us</h2>
            <a
              href={`mailto:${email}`}
              className="mt-1.5 block text-sm font-semibold hover:underline"
            >
              {email}
            </a>
            <p className="mt-1 text-xs text-muted">We reply within 24 hours</p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">Visit us</h2>
            <p className="mt-1.5 text-sm font-semibold">{address}</p>
            <p className="mt-1 text-xs text-muted">See the ground and meet our coaches</p>
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-surface p-6 sm:items-center">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <div className="flex-1">
            <p className="text-sm font-bold">Training hours</p>
            {scheduledBatches.length > 0 ? (
              <ul className="mt-1.5 space-y-1">
                {scheduledBatches.map((b) => (
                  <li key={b.name} className="text-sm text-muted">
                    <span className="font-semibold text-foreground">{b.name}:</span>{" "}
                    {[b.trainingDays, b.trainingTime, b.trainingLocation]
                      .filter(Boolean)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-sm text-muted">
                Batch schedules are confirmed at admission. Hours may vary by season —
                confirm on WhatsApp.
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted">
              Office: {academyHours}
            </p>
          </div>
        </div>

        <div className="card mt-10 overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="bg-gradient-to-br from-navy to-navy-light p-8 text-white md:p-10">
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                Already a member?
              </h2>
              <p className="mt-3 text-sm text-white/75">
                Sign in to your portal to see attendance, fees and performance.
              </p>
            </div>
            <div className="flex items-center justify-start gap-3 bg-surface p-8 md:justify-end md:p-10">
              <Link href="/login" className="btn-gold">
                Sign in to your portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter academyName={academyName} />
    </div>
  );
}