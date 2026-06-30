import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const PALETTE = ["#2f6b5f", "#9c4a18", "#1f5247", "#7eaba2", "#dd7a2e", "#163e36"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dim = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-[13px]", lg: "h-12 w-12 text-base" }[size];
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", dim)}
      style={{ backgroundColor: colorFor(name || "?") }}
    >
      {initials(name || "?") || "?"}
    </div>
  );
}
