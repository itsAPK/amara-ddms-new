import Link from "next/link";
import { FileIcon } from "@/components/ui/file-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFileSize } from "@/lib/file-meta";
import { timeAgo } from "@/lib/utils";
import { Inbox } from "lucide-react";
import type { FileType } from "@/db/schema";
import type { RecentUpload } from "@/lib/dashboard";

export function RecentUploadsList({ items }: { items: RecentUpload[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-6 w-6" />}
        title="No documents yet"
        description="Uploaded documents will show up here."
      />
    );
  }

  return (
    <div className="divide-y divide-paper-line">
      {items.map((doc) => (
        <Link
          key={doc.id}
          href={`/folders/${doc.folderId}`}
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-dim/50"
        >
          <FileIcon type={doc.fileType as FileType} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-ink-900">{doc.title}</p>
            <p className="truncate text-[12px] text-ink-500">
              {doc.departmentName} / {doc.folderName} · {formatFileSize(doc.fileSize)}
            </p>
          </div>
          <p className="shrink-0 text-[12px] text-ink-400">{timeAgo(doc.createdAt)}</p>
        </Link>
      ))}
    </div>
  );
}
