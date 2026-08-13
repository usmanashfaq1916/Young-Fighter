import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import Image from "next/image";

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={cn(
          "shrink-0 rounded-full border border-border object-cover",
          className
        )}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-navy font-bold text-gold-light",
        className
      )}
      aria-label={name}
    >
      <span style={{ fontSize: Math.max(10, size * 0.36) }}>{initials(name)}</span>
    </div>
  );
}
