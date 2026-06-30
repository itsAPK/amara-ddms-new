"use client";

import * as React from "react";
import Link from "next/link";
import { Folder, ChevronRight, Pencil, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FolderRow({
  id,
  name,
  documentCount,
  childCount,
  isAdmin,
  onRename,
  onDelete,
}: {
  id: string;
  name: string;
  documentCount: number;
  childCount: number;
  isAdmin: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    window.document.addEventListener("mousedown", onClick);
    return () => window.document.removeEventListener("mousedown", onClick);
  }, []);

  const parts: string[] = [];
  if (childCount > 0) parts.push(`${childCount} subfolder${childCount === 1 ? "" : "s"}`);
  parts.push(`${documentCount} document${documentCount === 1 ? "" : "s"}`);

  return (
    <div className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-paper-dim/50">
      <Link href={`/folders/${id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Folder className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-ink-900">{name}</p>
          <p className="truncate text-[12px] text-ink-500">{parts.join(" · ")}</p>
        </div>
      </Link>

      {isAdmin && (
        <div ref={ref} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-400 opacity-0 transition-all hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-paper-line bg-white py-1 shadow-pop"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
    </div>
  );
}
