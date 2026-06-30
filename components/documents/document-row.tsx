"use client";

import * as React from "react";
import { Eye, Download, Pencil, RefreshCw, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileIcon, fileTypeLabel } from "@/components/ui/file-icon";
import { formatFileSize } from "@/lib/file-meta";
import { timeAgo } from "@/lib/utils";
import type { DocumentListItem } from "@/lib/documents-query";
import type { PermissionFlags } from "@/db/schema";

export function DocumentRow({
  document: doc,
  permission,
  onPreview,
  onEdit,
  onReplace,
  onDelete,
}: {
  document: DocumentListItem;
  permission: PermissionFlags;
  onPreview: () => void;
  onEdit: () => void;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-paper-dim/50">
      <button onClick={onPreview} className="shrink-0">
        <FileIcon type={doc.fileType} />
      </button>
      <button onClick={onPreview} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13.5px] font-medium text-ink-900">{doc.title}</p>
        <p className="truncate text-[12px] text-ink-500">
          {fileTypeLabel(doc.fileType)} · {formatFileSize(doc.fileSize)} · v{doc.version} ·{" "}
          {timeAgo(doc.createdAt)}
          {doc.uploadedByName && <> · {doc.uploadedByName}</>}
        </p>
      </button>

      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {permission.canDownload && (
          <a
            href={`/api/documents/${doc.id}/download`}
            download
            title="Download"
            className="rounded-lg p-2 text-ink-400 opacity-0 transition-all hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={onPreview}
          title="Preview"
          className="rounded-lg p-2 text-ink-400 opacity-0 transition-all hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {(permission.canEdit || permission.canDelete) && (
        <div ref={ref} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
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
                className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-paper-line bg-white py-1 shadow-pop"
              >
                {permission.canEdit && (
                  <>
                    <MenuItem icon={Pencil} label="Edit details" onClick={() => (setMenuOpen(false), onEdit())} />
                    <MenuItem icon={RefreshCw} label="Replace file" onClick={() => (setMenuOpen(false), onReplace())} />
                  </>
                )}
                {permission.canDelete && (
                  <MenuItem
                    icon={Trash2}
                    label="Delete"
                    danger
                    onClick={() => (setMenuOpen(false), onDelete())}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] ${
        danger ? "text-red-600 hover:bg-red-50" : "text-ink-700 hover:bg-ink-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
