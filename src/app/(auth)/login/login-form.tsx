"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type AuthResult } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      Sign In
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthResult | undefined, FormData>(
    loginAction,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-4">
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
        error={state?.fieldErrors?.email?.[0]}
      />
      <Input
        name="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.password?.[0]}
        trailing={
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((s) => !s)}
            className="text-muted transition hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {next && <input type="hidden" name="next" value={next} />}
      <SubmitButton />
      <p className="text-center text-sm text-muted">
        <Link
          href="/forgot-password"
          className="font-semibold text-primary hover:underline"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
