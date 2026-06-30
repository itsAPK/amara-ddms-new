"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function UserMenu({ name, email, role }: { name: string; email: string; role: "SUPER_ADMIN" | "USER" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-ink-50"
      >
        <Avatar name={name} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-[13px] font-medium leading-tight text-ink-900">{name}</p>
          <p className="text-[11px] leading-tight text-ink-500">{role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-paper-line bg-white shadow-pop"
          >
            <div className="border-b border-paper-line px-4 py-3">
              <p className="truncate text-[13.5px] font-medium text-ink-900">{name}</p>
              <p className="truncate text-[12px] text-ink-500">{email}</p>
              <Badge variant={role === "SUPER_ADMIN" ? "warning" : "default"} className="mt-1.5">
                {role === "SUPER_ADMIN" ? "Super Admin" : "Staff User"}
              </Badge>
            </div>
            <Link
              href="/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-ink-700 hover:bg-ink-50"
            >
              <KeyRound className="h-4 w-4 text-ink-400" />
              Change password
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13.5px] text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
