"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options = [], placeholder, ...props }, ref) => (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={cn(
          "input appearance-none bg-no-repeat pr-9",
          "[background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235f6b61%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
          "[background-position:right_0.75rem_center]",
          error && "border-danger focus:border-danger focus:ring-danger/25"
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
