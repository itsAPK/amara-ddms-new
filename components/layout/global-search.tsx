"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { searchDocuments, type SearchResultItem } from "@/lib/actions/search";
import { FileIcon } from "@/components/ui/file-icon";
import { formatFileSize } from "@/lib/file-meta";
import type { FileType } from "@/db/schema";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchDocuments({ q: query });
        setResults(res.slice(0, 6));
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(handle);
  }, [query]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const goToFullResults = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) goToFullResults();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search documents, folders, departments…"
          className="w-full rounded-lg border border-paper-line bg-paper-dim/60 py-2 pl-9 pr-9 text-[13.5px] text-ink-900 placeholder:text-ink-400 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-500/25"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />}
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-paper-line bg-white shadow-pop"
          >
            {results.length === 0 && !loading && (
              <p className="px-4 py-6 text-center text-[13px] text-ink-500">
                No documents found for &ldquo;{query}&rdquo;
              </p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setOpen(false);
                  router.push(`/folders/${r.folderId}`);
                }}
                className="flex w-full items-center gap-3 border-b border-paper-line px-3.5 py-2.5 text-left last:border-0 hover:bg-paper-dim/60"
              >
                <FileIcon type={r.fileType as FileType} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink-900">{r.title}</p>
                  <p className="truncate text-[12px] text-ink-500">
                    {r.departmentName} / {r.folderName} · {formatFileSize(r.fileSize)}
                  </p>
                </div>
              </button>
            ))}
            {results.length > 0 && (
              <button
                onClick={goToFullResults}
                className="flex w-full items-center justify-center gap-1.5 bg-paper-dim/50 py-2.5 text-[12.5px] font-medium text-ink-700 hover:bg-paper-dim"
              >
                View all results <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
