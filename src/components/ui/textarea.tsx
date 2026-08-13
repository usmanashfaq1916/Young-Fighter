"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={cn(
          "input min-h-24 resize-y",
          error && "border-danger focus:border-danger focus:ring-danger/25"
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
