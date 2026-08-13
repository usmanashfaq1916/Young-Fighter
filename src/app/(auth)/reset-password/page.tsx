import type { Metadata } from "next";
import Image from "next/image";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";

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
              Set New Password
            </h1>
          </div>
          <div className="px-8 py-8">
            {token ? (
              <>
                <h2 className="text-lg font-bold text-foreground">
                  Choose a new password
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Use at least 8 characters with a letter and a number.
                </p>
                <ResetPasswordForm token={token} />
              </>
            ) : (
              <p className="py-6 text-center text-sm text-danger">
                Missing reset token. Please use the link from your email.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
