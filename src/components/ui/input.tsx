"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={cn(
          "input",
          error && "border-danger focus:border-danger focus:ring-danger/25"
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
