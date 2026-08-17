import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Trophy,
  Target,
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Video,
  Network,
  Award,
  CalendarDays,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { db } from "@/lib/db";
import { verifySession, dashboardPathFor } from "@/lib/auth";
import { ACADEMY_NAME, billingTypeLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { WhatsAppIcon } from "@/components/landing/whatsapp-icon";

const CONTACT_PHONE = "+92 3325 4221555";
const WHATSAPP_LINK =
  "https://wa.me/9233254221555?text=Hello%20Young%20Fighters%20Academy!%20I%27d%20like%20to%20know%20more.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Young Fighters Academy — a cricket academy developing tomorrow's champions with structured coaching, fitness training, match exposure and player development programs.",
};

type IconType = typeof Users;

const VALUES: { icon: IconType; title: string; text: string }[] = [
  {
    icon: Target,
    title: "Structured coaching",
    text: "Age-appropriate training plans with clear goals, regular assessments and honest feedback at every stage.",
  },
  {
    icon: Dumbbell,
    title: "Fitness & conditioning",
    text: "Cricket-specific fitness work — speed, agility, strength and endurance — built into every training week.",
  },
  {
    icon: ShieldCheck,
    title: "Discipline & sportsmanship",
    text: "Punctuality, respect for teammates and umpires, and playing the game the right way are non-negotiables.",
  },
  {
    icon: HeartPulse,
    title: "Care & safety",
    text: "Supervised sessions, age-appropriate workloads and a safe environment for every young player.",
  },
];

const DEVELOPMENT: { icon: IconType; title: string; text: string }[] = [
  {
    icon: Network,
    title: "Skill development",
    text: "Batting, bowling, wicket-keeping and fielding fundamentals, refined through drills, nets and match play.",
  },
  {
    icon: Award,
    title: "Progress tracking",
    text: "Every player is assessed on technique, fitness and discipline, with goals set and reviewed together with coaches.",
  },
  {
    icon: Trophy,
    title: "Match exposure",
    text: "Friendly matches and tournaments give young players real game time, scorecards and man-of-the-match recognition.",
  },
];

const FACILITIES: { icon: IconType; title: string; text: string }[] = [
  {
    icon: ClipboardCheck,
    title: "Practice nets",
    text: "Dedicated net facilities for bowling and batting practice under coach supervision.",
  },
  {
    icon: Dumbbell,
    title: "Fitness area",
    text: "Conditioning equipment and drills for strength, agility and cricket-specific movement.",
  },
  {
    icon: Video,
    title: "Video analysis",
    text: "Recorded sessions reviewed with players to fine-tune technique and correct errors.",
  },
  {
    icon: Users,
    title: "Match ground",
    text: "Access to grounds for full matches, tournaments and competitive match practice.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What age groups does the academy train?",
    a: "Our programs are designed for school-age players at different stages. Contact us and we will guide you to the right batch for your child's age and level.",
  },
  {
    q: "Does my child need prior cricket experience?",
    a: "No. Beginners are welcome and are placed in a batch suited to their level. Our coaches build fundamentals from the ground up.",
  },
  {
    q: "How do trials and admission work?",
    a: "Submit an application, attend a trial session so coaches can assess level and needs, and we will confirm the right batch and schedule for your child.",
  },
  {
    q: "How are fees structured?",
    a: "Monthly fee plans vary by program. Our team will share the full details for your child's batch when you apply or visit the academy.",
  },
  {
    q: "How will I know how my child is progressing?",
    a: "Players are assessed regularly on skills, fitness and discipline, and goals are reviewed with coaches. Parents can also follow their child's progress through the academy portal.",
  },
];

const ADMISSION_STEPS: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FileText,
    title: "1. Submit application",
    text: "Fill in the online form with your child's details and cricket experience.",
  },
  {
    icon: CalendarDays,
    title: "2. Trial & review",
    text: "Attend a trial session where coaches assess level, fitness and readiness.",
  },
  {
    icon: ClipboardCheck,
    title: "3. Batch placement",
    text: "We confirm the right batch, schedule and program for your child.",
  },
  {
    icon: Trophy,
    title: "4. Start training",
    text: "Welcome aboard — training, assessments and match play begin.",
  },
];

export default async function HomePage() {
  const user = await verifySession();
  const dashboardHref = user ? dashboardPathFor(user.role) : "/login";

  const [
    settings,
    batches,
    activeStudents,
    coachCount,
    matchCount,
    achievements,
    topPerformers,
    packages,
  ] = await Promise.all([
    db.setting.findMany(),
    db.batch.findMany({
      select: {
        name: true,
        description: true,
        trainingDays: true,
        trainingTime: true,
        trainingLocation: true,
        coach: { select: { fullName: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.student.count({ where: { status: "ACTIVE", deletedAt: null } }),
    db.user.count({ where: { role: "COACH", status: "ACTIVE" } }),
    db.match.count(),
    db.matchRecord.aggregate({
      _count: { _all: true },
      _sum: { runs: true, wickets: true, catches: true },
      where: { selected: true },
    }),
    (async () => {
      const latest = await db.performance.findMany({
        where: { student: { status: "ACTIVE", deletedAt: null } },
        orderBy: { date: "desc" },
        take: 300,
        select: {
          studentId: true,
          overallRating: true,
          date: true,
          student: {
            select: {
              fullName: true,
              skillLevel: true,
              photoUrl: true,
              studentId: true,
              matchRecords: {
                select: { manOfTheMatch: true },
              },
            },
          },
        },
      });
      const best = new Map<string, (typeof latest)[number]>();
      for (const p of latest) {
        if (!best.has(p.studentId) || p.date > best.get(p.studentId)!.date) {
          best.set(p.studentId, p);
        }
      }
      return Array.from(best.values())
        .sort((a, b) => b.overallRating - a.overallRating)
        .slice(0, 5)
        .map((p) => ({
          name: p.student.fullName,
          rating: p.overallRating,
          skillLevel: p.student.skillLevel,
          photoUrl: p.student.photoUrl,
          studentId: p.student.studentId,
          motm: p.student.matchRecords.filter((m) => m.manOfTheMatch).length,
        }));
    })(),
    db.package.findMany({
      where: { isActive: true },
      orderBy: [{ price: "asc" }, { name: "asc" }],
    }),
  ]);

  const settingMap: Record<string, string> = {};
  for (const s of settings) settingMap[s.key] = s.value;

  const academyName = settingMap.academyName || ACADEMY_NAME;
  const phone = settingMap.academyPhone || CONTACT_PHONE;
  const email = settingMap.academyEmail || "info@youngfighters.com.pk";
  const address = settingMap.academyAddress || "City Ground, Pakistan";

  const stats = [
    { label: "Active Students", value: activeStudents, icon: Users },
    { label: "Qualified Coaches", value: coachCount, icon: GraduationCap },
    { label: "Training Batches", value: batches.length, icon: ClipboardCheck },
    { label: "Matches Played", value: matchCount, icon: Trophy },
  ];

  const achievementStats = [
    {
      label: "Player appearances",
      value: achievements._count._all,
      icon: Users,
    },
    { label: "Runs scored", value: achievements._sum.runs ?? 0, icon: Trophy },
    { label: "Wickets taken", value: achievements._sum.wickets ?? 0, icon: Target },
    { label: "Catches held", value: achievements._sum.catches ?? 0, icon: ShieldCheck },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: academyName,
            description:
              "Cricket academy developing young players with structured coaching, fitness training and match exposure.",
            telephone: phone,
            email,
            address: {
              "@type": "PostalAddress",
              streetAddress: address,
              addressCountry: "PK",
            },
            url: "https://young-fighters-academy.vercel.app",
            priceRange: "$$",
          }),
        }}
      />
      <LandingHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center md:pb-24 md:pt-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Welcome to {academyName}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Developing Tomorrow&apos;s Cricket Champions
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 md:text-lg">
            A cricket academy where young players build real technique, fitness and
            character — through structured coaching, regular assessments and genuine
            match experience.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/programs" className="btn-gold !px-6 !py-3 text-base">
              Explore our programs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#programs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              View training batches
            </Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto h-6 w-6 text-gold-dark" />
              <p className="mt-2 text-3xl font-black tracking-tight">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              About the academy
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Serious cricket training for young players
            </h2>
            <p className="mt-4 text-muted">
              {academyName} is a cricket academy focused on developing young players
              the right way. Our coaching staff work with each student on batting,
              bowling, fielding and fitness, set clear goals and review progress
              regularly — so improvement is measurable, not just hoped for.
            </p>
            <p className="mt-3 text-muted">
              Players train in batches suited to their age and level, get real match
              exposure through fixtures and tournaments, and learn discipline and
              sportsmanship that stay with them long after they leave the nets.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-gold">
                Visit or contact us
              </Link>
              <Link href="/apply" className="btn-outline-dark">
                Apply for admission
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="card p-5">
                <v.icon className="h-6 w-6 text-gold-dark" />
                <h3 className="mt-3 text-sm font-bold">{v.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs & batches */}
      <section id="programs" className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Programs & training
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Coaching that grows with the player
            </h2>
            <p className="mt-3 text-muted">
              Beginners learn fundamentals in a supportive environment; advanced
              players sharpen technique, cricket sense and match temperament.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {DEVELOPMENT.map((d) => (
              <div key={d.title} className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
                  <d.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.text}</p>
              </div>
            ))}
          </div>

          {batches.length > 0 && (
            <div className="mt-12">
              <h3 className="text-center text-sm font-bold uppercase tracking-wide text-muted">
                Current training batches
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {batches.map((b) => (
                  <div key={b.name} className="card p-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-gold-dark" />
                      <h4 className="text-base font-bold">{b.name}</h4>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {b.description || "Batch training program"}
                    </p>
                    {(b.trainingDays || b.trainingTime || b.trainingLocation) && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold text-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-gold-dark" />
                        {[b.trainingDays, b.trainingTime, b.trainingLocation]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {b.coach && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Coach · {b.coach.fullName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Facilities */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
            Facilities
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Everything a young cricketer needs
          </h2>
          <p className="mt-3 text-muted">
            Training spaces and equipment that let coaches run proper sessions —
            from first net practice to full match days.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements (real data) */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              On the field
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Tracked, not claimed — real match numbers
            </h2>
            <p className="mt-3 text-muted">
              Every appearance, run, wicket and catch is recorded from our matches.
              These are the academy&apos;s live numbers.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {achievementStats.map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <s.icon className="mx-auto h-6 w-6 text-gold-dark" />
                <p className="mt-2 text-3xl font-black tracking-tight">
                  {s.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {topPerformers.length > 0 && (
            <div className="mt-12">
              <h3 className="text-center text-sm font-bold uppercase tracking-wide text-muted">
                Top-rated players this season
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {topPerformers.map((p) => (
                  <div key={p.studentId} className="card p-5 text-center">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="mx-auto h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy text-gold-light">
                        <Users className="h-7 w-7" />
                      </div>
                    )}
                    <p className="mt-3 truncate text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted">{p.studentId}</p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold-dark dark:text-gold-light">
                      <Trophy className="h-3 w-3" /> {p.rating.toFixed(1)} rating
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {p.skillLevel.replace("_", " ").toLowerCase()}
                      {p.motm > 0 ? ` · ${p.motm}× player of the match` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Admission process */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
            Trials & admission
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Joining is simple
          </h2>
          <p className="mt-3 text-muted">
            Apply online, attend a trial, and we will place your child in the right
            batch. No experience required — just enthusiasm.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ADMISSION_STEPS.map((s) => (
            <div key={s.title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/apply" className="btn-gold">
            Start your application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Packages (only when active packages exist in the database) */}
      {packages.length > 0 && (
        <section className="bg-surface-alt">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
                Training packages
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Programs that fit your child&apos;s journey
              </h2>
              <p className="mt-3 text-muted">
                Current packages offered by the academy. Details are confirmed with
                your batch placement.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => (
                <div key={p.id} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black">{p.name}</h3>
                    {p.sessionsPerWeek > 0 && (
                      <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold-dark dark:text-gold-light">
                        {p.sessionsPerWeek}/week
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-black tracking-tight text-primary">
                    {formatMoney(p.price)}
                    <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      / {billingTypeLabel[p.billingType].toLowerCase()}
                    </span>
                  </p>
                  {p.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{p.description}</p>
                  )}
                  {p.features.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-5">
                    <Link href="/apply" className="btn-outline-dark w-full justify-center">
                      Apply for this package
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Questions parents ask us
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
                  {f.q}
                  <span className="text-gold-dark transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="bg-gradient-to-br from-navy to-navy-light p-8 text-white md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
                Get in touch
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
                Ready to start your child&apos;s cricket journey?
              </h2>
              <p className="mt-3 text-sm text-white/75">
                Visit the academy, call or message us with any questions, or submit
                an application today.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/apply" className="btn-gold">
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-outline-light">
                  Contact us
                </Link>
              </div>
            </div>
            <div className="space-y-5 bg-surface p-8 md:p-10">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Phone
                  </p>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm font-semibold hover:underline">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    WhatsApp
                  </p>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-success hover:underline"
                  >
                    Chat with us on WhatsApp
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Email
                  </p>
                  <a href={`mailto:${email}`} className="text-sm font-semibold hover:underline">
                    {email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Address
                  </p>
                  <p className="text-sm font-semibold">{address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter academyName={academyName} />
    </div>
  );
}