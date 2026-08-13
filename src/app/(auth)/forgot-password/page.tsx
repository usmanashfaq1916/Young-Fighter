import type { Metadata } from "next";
import Image from "next/image";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy p-4">
      <div className="w-full max-w-md">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-b from-navy to-navy-light px-8 pb-6 pt-10 text-center">
            <Image
              src="/YFA_logo.svg"
              alt="Young Fighters Academy"
              width={90}
              height={90}
              className="mx-auto drop-shadow-lg"
            />
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              Reset Password
            </h1>
          </div>
          <div className="px-8 py-8">
            <h2 className="text-lg font-bold text-foreground">
              Forgot your password?
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
