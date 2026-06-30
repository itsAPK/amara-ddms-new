import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </span>
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-[14.5px] text-ink-900 placeholder:text-ink-400/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-500/30 focus:border-ink-400",
              error ? "border-red-400" : "border-paper-line",
              className
            )}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-[14.5px] text-ink-900 placeholder:text-ink-400/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-500/30 focus:border-ink-400",
          error ? "border-red-400" : "border-paper-line",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
