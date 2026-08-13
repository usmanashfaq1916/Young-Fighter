import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await verifySession();
  const query = await searchParams;
  if (user) redirect("/dashboard");
  const next = typeof query.next === "string" ? query.next : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy p-4">
      <div className="w-full max-w-md">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-b from-navy to-navy-light px-8 pb-10 pt-10 text-center">
            <Image
              src="/YFA_logo.svg"
              alt="Young Fighters Academy"
              width={110}
              height={110}
              className="mx-auto drop-shadow-lg"
            />
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Young Fighters Academy
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Cricket Academy Management Platform
            </p>
          </div>
          <div className="px-8 py-8">
            <h2 className="text-lg font-bold text-foreground">Welcome back</h2>
            <p className="mt-0.5 text-sm text-muted">
              Sign in to access your dashboard.
            </p>
            <LoginForm next={next} />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Young Fighters Academy
        </p>
      </div>
    </div>
  );
}
