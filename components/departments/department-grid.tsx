"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DeptIcon } from "@/lib/icon-map";
import { EmptyState } from "@/components/ui/empty-state";
import { Library } from "lucide-react";

interface DeptCard {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
}

export function DepartmentGrid({ departments }: { departments: DeptCard[] }) {
  if (departments.length === 0) {
    return (
      <EmptyState
        icon={<Library className="h-6 w-6" />}
        title="No departments assigned yet"
        description="Your administrator hasn't granted you access to any department. Reach out to them to get started."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept, i) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={`/departments/${dept.id}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-xl2 border border-paper-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: dept.color }} />
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: dept.color + "14", color: dept.color }}
            >
              <DeptIcon name={dept.icon} className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-[17px] text-ink-900">{dept.name}</h3>
            {dept.description && (
              <p className="mt-1 line-clamp-2 flex-1 text-[13px] text-ink-500">{dept.description}</p>
            )}
            <div className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-ink-600 transition-colors group-hover:text-ink-900">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
