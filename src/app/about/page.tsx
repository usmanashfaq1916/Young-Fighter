import type { Metadata } from "next";
import {
  Target,
  Dumbbell,
  ShieldCheck,
  HeartPulse,
  ClipboardCheck,
  Video,
  Users,
  Network,
  Award,
  Trophy,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { ACADEMY_NAME } from "@/lib/constants";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Young Fighters Academy — our coaching philosophy, facilities and what makes our training program different.",
};

type IconType = typeof Target;

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

export default async function AboutPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            About the academy
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Serious cricket training for young players
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            {ACADEMY_NAME} is a cricket academy focused on developing young
            players the right way — with measurable progress, not just hopes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Our approach
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Coaching with clear goals and honest feedback
            </h2>
            <p className="mt-4 text-muted">
              Our coaching staff work with each student on batting, bowling,
              fielding and fitness, set clear goals and review progress
              regularly — so improvement is measurable, not just hoped for.
            </p>
            <p className="mt-3 text-muted">
              Players train in batches suited to their age and level, get real
              match exposure through fixtures and tournaments, and learn
              discipline and sportsmanship that stay with them long after they
              leave the nets.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/programs" className="btn-gold">
                View our programs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="btn-outline-dark">
                Visit or contact us
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

      <section className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Player development
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              How we build complete cricketers
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
        </div>
      </section>

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
        <div className="mt-10 text-center">
          <Link href="/apply" className="btn-gold">
            Start your application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}