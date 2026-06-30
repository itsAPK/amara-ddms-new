import { Eye, Upload, Pencil, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PermissionFlags } from "@/db/schema";

const ITEMS: { key: keyof PermissionFlags; label: string; Icon: typeof Eye }[] = [
  { key: "canView", label: "View", Icon: Eye },
  { key: "canUpload", label: "Upload", Icon: Upload },
  { key: "canEdit", label: "Edit", Icon: Pencil },
  { key: "canDelete", label: "Delete", Icon: Trash2 },
  { key: "canDownload", label: "Download", Icon: Download },
];

export function PermissionPills({ permission }: { permission: PermissionFlags }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ITEMS.filter((i) => permission[i.key]).map((i) => (
        <span
          key={i.key}
          className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-600"
          title={i.label}
        >
          <i.Icon className="h-3 w-3" />
          {i.label}
        </span>
      ))}
      {ITEMS.every((i) => !permission[i.key]) && (
        <span className="text-[11.5px] text-ink-400">No access</span>
      )}
    </div>
  );
}

export const PERMISSION_ITEMS = ITEMS;
