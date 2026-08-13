"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40",
  gold: "bg-gradient-to-b from-gold-light to-gold text-navy hover:brightness-105 focus-visible:ring-gold/40",
  secondary: "bg-surface-alt text-foreground hover:bg-border focus-visible:ring-border",
  ghost: "text-foreground hover:bg-surface-alt focus-visible:ring-border",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface-alt focus-visible:ring-border",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
