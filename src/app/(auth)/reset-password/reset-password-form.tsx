"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction, type AuthResult } from "@/app/actions/auth";
import { CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      Reset Password
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthResult | undefined, FormData>(
    resetPasswordAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-sm text-muted">
          Your password has been reset. You can now sign in with your new
          password.
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
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </div>
      )}
      <Input
        name="password"
        type="password"
        label="New password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.password?.[0]}
      />
      <Input
        name="confirm"
        type="password"
        label="Confirm password"
        placeholder="Repeat new password"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.confirm?.[0]}
      />
      <SubmitButton />
    </form>
  );
}
