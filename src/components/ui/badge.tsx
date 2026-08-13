"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone =
  | "green"
  | "gold"
  | "red"
  | "gray"
  | "blue"
  | "navy"
  | "amber";

const tones: Record<BadgeTone, string> = {
  green: "bg-success/15 text-success",
  gold: "bg-gold/20 text-gold-dark dark:text-gold-light",
  red: "bg-danger/15 text-danger",
  gray: "bg-surface-alt text-muted",
  blue: "bg-info/15 text-info",
  navy: "bg-navy text-gold-light",
  amber: "bg-warning/15 text-warning",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={cn("badge", tones[tone], className)}>{children}</span>;
}
