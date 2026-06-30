"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl2 border border-paper-line bg-white p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink-500">{label}</p>
        <div
          className={cn("flex h-9 w-9 items-center justify-center rounded-lg")}
          style={{ backgroundColor: (accent ?? "#2f6b5f") + "14", color: accent ?? "#2f6b5f" }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 font-display text-[28px] leading-none text-ink-900">{value}</p>
    </motion.div>
  );
}
