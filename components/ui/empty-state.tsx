import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 px-6 py-16 text-center", className)}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
        {icon}
      </div>
      <p className="font-display text-[16px] text-ink-800">{title}</p>
      {description && <p className="max-w-sm text-[13.5px] text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
