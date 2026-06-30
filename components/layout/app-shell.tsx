"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { InactivityGuard } from "@/components/layout/inactivity-guard";
import type { SessionUser } from "@/lib/session";

interface NavDepartment {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function AppShell({
  user,
  departments,
  children,
}: {
  user: SessionUser;
  departments: NavDepartment[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar departments={departments} isAdmin={user.role === "SUPER_ADMIN"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <InactivityGuard />
    </div>
  );
}
