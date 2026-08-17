"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, trailing, ...props }, ref) => (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(
            "input",
            trailing && "pr-11",
            error && "border-danger focus:border-danger focus:ring-danger/25"
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
