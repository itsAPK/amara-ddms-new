"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? { knob: 14, pad: 2 } : { knob: 18, pad: 2 };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
        size === "sm" ? "h-[18px] w-8" : "h-[22px] w-10",
        checked ? "bg-ink-600" : "bg-ink-200"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute rounded-full bg-white shadow"
        style={{
          height: dims.knob,
          width: dims.knob,
          left: checked ? `calc(100% - ${dims.knob + dims.pad}px)` : dims.pad,
        }}
      />
    </button>
  );
}
