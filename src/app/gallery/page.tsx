import type { Metadata } from "next";
import Link from "next/link";
import { Images, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME } from "@/lib/constants";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos from Young Fighters Academy — our young players in training, in matches and in the nets.",
};

export default async function GalleryPage() {
  const photos = await db.student.findMany({
    where: { status: "ACTIVE", deletedAt: null, photoUrl: { not: null } },
    select: { id: true, fullName: true, photoUrl: true, skillLevel: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Gallery
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Moments from the academy
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Our young players in training, in the nets and on the field.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {photos.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <figure key={p.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photoUrl!}
                  alt={p.fullName}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="p-4">
                  <p className="text-sm font-bold">{p.fullName}</p>
                  <p className="text-xs text-muted">
                    {p.skillLevel.replace("_", " ").toLowerCase()} player
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Images className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted">
              Photos will appear here as the academy gallery grows.
            </p>
            <Link href="/contact" className="btn-gold mt-2">
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