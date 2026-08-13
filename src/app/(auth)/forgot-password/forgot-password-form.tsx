"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction, type AuthResult } from "@/app/actions/auth";
import { CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      Send Reset Link
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthResult | undefined, FormData>(
    forgotPasswordAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-sm text-muted">
          If an account exists for that email, a password reset link has been
          sent. Please check your inbox.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </div>
      )}
      <Input
        name="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <SubmitButton />
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
