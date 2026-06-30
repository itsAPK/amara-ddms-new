import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav className={cn("flex items-center gap-1.5 text-[13px] text-ink-500 flex-wrap", className)}>
      <Link href="/dashboard" className="flex items-center text-ink-400 hover:text-ink-700">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-ink-300" />
          {item.href ? (
            <Link href={item.href} className="hover:text-ink-800 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
