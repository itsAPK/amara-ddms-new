"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Library,
  Settings2,
  Users as UsersIcon,
  ScrollText,
  ChevronLeft,
  ChevronDown,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeptIcon } from "@/lib/icon-map";

interface NavDepartment {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function Sidebar({
  departments,
  isAdmin,
}: {
  departments: NavDepartment[];
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [deptOpen, setDeptOpen] = React.useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar-scroll relative flex h-screen shrink-0 flex-col overflow-y-auto bg-ink-900 text-ink-100"
    >
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-ink-950">
          <BookMarked className="h-5 w-5" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="font-display text-[15px] leading-tight text-white">Amara Hospital</p>
              <p className="text-[11px] tracking-wide text-ink-300">Document Management</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive("/dashboard")} collapsed={collapsed} />
        <NavLink href="/search" icon={Search} label="Search" active={isActive("/search")} collapsed={collapsed} />

        <div className="mt-5">
          <button
            onClick={() => setDeptOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-200"
          >
            <Library className="h-3.5 w-3.5" />
            {!collapsed && <span className="flex-1 text-left">Departments</span>}
            {!collapsed && (
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", deptOpen ? "" : "-rotate-90")} />
            )}
          </button>

          <AnimatePresence initial={false}>
            {(deptOpen || collapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-0.5">
                  {departments.map((dept) => {
                    const href = `/departments/${dept.id}`;
                    const active = isActive(href);
                    return (
                      <Link
                        key={dept.id}
                        href={href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2.5 text-[13.5px] transition-colors",
                          active ? "bg-white/10 text-white" : "text-ink-200 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                          style={{ backgroundColor: dept.color }}
                        />
                        <DeptIcon name={dept.icon} className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{dept.name}</span>}
                      </Link>
                    );
                  })}
                  {departments.length === 0 && !collapsed && (
                    <p className="px-3 py-2 text-[12px] text-ink-400">No departments assigned yet.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isAdmin && (
          <div className="mt-6">
            {!collapsed && (
              <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Administration
              </p>
            )}
            <NavLink href="/admin/departments" icon={Settings2} label="Departments" active={isActive("/admin/departments")} collapsed={collapsed} />
            <NavLink href="/admin/users" icon={UsersIcon} label="Users & Access" active={isActive("/admin/users")} collapsed={collapsed} />
            <NavLink href="/admin/audit-logs" icon={ScrollText} label="Audit Logs" active={isActive("/admin/audit-logs")} collapsed={collapsed} />
          </div>
        )}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="m-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-ink-300 hover:bg-white/5 hover:text-white"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && <span className="text-[12.5px]">Collapse</span>}
      </button>
    </motion.aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
        active ? "bg-amber-500 text-ink-950" : "text-ink-200 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
