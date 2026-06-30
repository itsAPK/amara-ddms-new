import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-[14.5px] text-ink-900 placeholder:text-ink-400/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-500/30 focus:border-ink-400 resize-none",
        error ? "border-red-400" : "border-paper-line",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
