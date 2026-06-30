"use client";

import * as React from "react";
import { Download, History } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/ui/file-icon";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, isPreviewable } from "@/lib/file-meta";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { getVersionHistory } from "@/lib/actions/documents";
import type { DocumentListItem } from "@/lib/documents-query";
import type { DocumentVersionItem } from "@/lib/documents-query";

export function PreviewDocumentModal({
  open,
  onClose,
  document,
  canDownload,
}: {
  open: boolean;
  onClose: () => void;
  document: DocumentListItem;
  canDownload: boolean;
}) {
  const [versions, setVersions] = React.useState<DocumentVersionItem[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShowHistory(false);
      getVersionHistory(document.id).then((res) => {
        if (res.success && res.data) setVersions(res.data);
      });
    }
  }, [open, document.id]);

  const previewable = isPreviewable(document.fileType);

  return (
    <Dialog open={open} onClose={onClose} size="xl">
      <DialogHeader
        title={document.title}
        description={`${document.fileName} · v${document.version} · ${formatFileSize(document.fileSize)}`}
        onClose={onClose}
      />
      <DialogBody className="p-0">
        <div className="preview-frame flex h-[420px] items-center justify-center">
          {previewable ? (
            document.fileType === "PDF" ? (
              <iframe src={`/api/documents/${document.id}/preview`} className="h-full w-full" title={document.title} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/documents/${document.id}/preview`}
                alt={document.title}
                className="max-h-full max-w-full object-contain"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-ink-300">
              <FileIcon type={document.fileType} size="lg" />
              <p className="mt-2 text-[13px] text-ink-300">No inline preview for this file type.</p>
              <p className="text-[12px] text-ink-400">Download it to view the full content.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 px-6 py-5">
          {document.description && <p className="text-[13.5px] text-ink-700">{document.description}</p>}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-ink-500">
            <span>
              Uploaded by <strong className="text-ink-700">{document.uploadedByName ?? "Unknown"}</strong>
            </span>
            <span>{formatDateTime(document.createdAt)}</span>
            {document.updatedAt.getTime() !== document.createdAt.getTime() && (
              <span>Updated {timeAgo(document.updatedAt)}</span>
            )}
          </div>

          {versions.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-600 hover:text-ink-900"
              >
                <History className="h-3.5 w-3.5" />
                {showHistory ? "Hide" : "Show"} version history ({versions.length})
              </button>
              {showHistory && (
                <ul className="mt-2 space-y-1.5 rounded-lg border border-paper-line bg-paper-dim/40 p-3">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between text-[12px] text-ink-600">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">v{v.version}</Badge>
                        {v.fileName}
                      </span>
                      <span className="text-ink-400">
                        {formatFileSize(v.fileSize)} · {timeAgo(v.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
        {canDownload && (
          <a href={`/api/documents/${document.id}/download`} download>
            <Button size="sm" icon={<Download className="h-3.5 w-3.5" />}>
              Download
            </Button>
          </a>
        )}
      </DialogFooter>
    </Dialog>
  );
}
