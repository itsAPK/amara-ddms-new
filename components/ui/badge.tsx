import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-ink-100 text-ink-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-800",
  outline: "border border-paper-line text-ink-600 bg-transparent",
};

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: Variant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
