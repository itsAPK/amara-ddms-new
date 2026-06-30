"use client";

import * as React from "react";
import { UploadCloud, File as FileIcon2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-meta";

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png";

export function FileDropZone({
  file,
  onFileSelected,
}: {
  file: File | null;
  onFileSelected: (file: File | null) => void;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-paper-line bg-paper-dim/40 px-3.5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
          <FileIcon2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink-900">{file.name}</p>
          <p className="text-[11.5px] text-ink-500">{formatFileSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFileSelected(null)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFileSelected(dropped);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
        dragOver ? "border-ink-400 bg-ink-50" : "border-paper-line bg-paper-dim/30 hover:bg-paper-dim/50"
      )}
    >
      <UploadCloud className="h-7 w-7 text-ink-400" />
      <p className="text-[13px] font-medium text-ink-700">Click to choose a file, or drag it here</p>
      <p className="text-[11.5px] text-ink-400">PDF, Word, Excel, PowerPoint, JPG or PNG</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
