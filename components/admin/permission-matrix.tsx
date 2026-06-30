"use client";

import * as React from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DeptIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import {
  setDepartmentPermission,
  setFolderPermission,
  clearFolderPermissionOverride,
  type DepartmentPermissionView,
  type FolderPermissionNode,
} from "@/lib/actions/permissions";
import type { PermissionFlags } from "@/db/schema";
import { PERMISSION_ITEMS } from "@/components/ui/permission-pills";

const NO_ACCESS: PermissionFlags = {
  canView: false,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
};

export function PermissionMatrix({ userId, matrix }: { userId: string; matrix: DepartmentPermissionView[] }) {
  return (
    <div className="space-y-3">
      {matrix.map((view) => (
        <DepartmentSection key={view.department.id} userId={userId} view={view} />
      ))}
    </div>
  );
}

function DepartmentSection({ userId, view }: { userId: string; view: DepartmentPermissionView }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [permission, setPermission] = React.useState<PermissionFlags>(view.permission ?? NO_ACCESS);
  const [saving, setSaving] = React.useState(false);

  async function handleToggle(key: keyof PermissionFlags, value: boolean) {
    const next = { ...permission, [key]: value };
    setPermission(next);
    setSaving(true);
    const result = await setDepartmentPermission(userId, view.department.id, next);
    setSaving(false);
    if (!result.success) {
      setPermission(permission);
      toast({ title: "Couldn't update permission", description: result.error, variant: "error" });
    }
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-paper-line bg-white shadow-card">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-ink-400 hover:text-ink-700">
          <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
        </button>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: view.department.color + "14", color: view.department.color }}
        >
          <DeptIcon name={view.department.icon} className="h-4 w-4" />
        </div>
        <p className="flex-1 text-[13.5px] font-medium text-ink-900">{view.department.name}</p>
        <PermissionToggles permission={permission} onToggle={handleToggle} saving={saving} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-paper-line bg-paper-dim/30"
          >
            {view.folders.length === 0 ? (
              <p className="px-8 py-3 text-[12.5px] text-ink-400">No folders in this department yet.</p>
            ) : (
              <div className="py-1.5">
                {view.folders.map((folder) => (
                  <FolderPermissionRow
                    key={folder.id}
                    userId={userId}
                    node={folder}
                    inherited={permission}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderPermissionRow({
  userId,
  node,
  inherited,
  depth,
}: {
  userId: string;
  node: FolderPermissionNode;
  inherited: PermissionFlags;
  depth: number;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = React.useState(false);
  const [override, setOverride] = React.useState<PermissionFlags | null>(node.override);
  const [saving, setSaving] = React.useState(false);

  const effective = override ?? inherited;
  const hasOverride = !!override;

  async function handleToggle(key: keyof PermissionFlags, value: boolean) {
    const base = override ?? inherited;
    const next = { ...base, [key]: value };
    setOverride(next);
    setSaving(true);
    const result = await setFolderPermission(userId, node.id, next);
    setSaving(false);
    if (!result.success) {
      setOverride(override);
      toast({ title: "Couldn't update permission", description: result.error, variant: "error" });
    }
  }

  async function handleReset() {
    setSaving(true);
    const result = await clearFolderPermissionOverride(userId, node.id);
    setSaving(false);
    if (!result.success) {
      toast({ title: "Couldn't reset permission", description: result.error, variant: "error" });
      return;
    }
    setOverride(null);
  }

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 pr-5" style={{ paddingLeft: 16 + depth * 20 }}>
        {node.children.length > 0 ? (
          <button onClick={() => setExpanded((v) => !v)} className="text-ink-400 hover:text-ink-700">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        <p className="flex-1 truncate text-[13px] text-ink-700">{node.name}</p>
        {hasOverride && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink-700"
            title="Reset to inherited permission"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
        {!hasOverride && <Badge variant="outline">Inherited</Badge>}
        <PermissionToggles permission={effective} onToggle={handleToggle} saving={saving} compact />
      </div>
      {expanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <FolderPermissionRow key={child.id} userId={userId} node={child} inherited={effective} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionToggles({
  permission,
  onToggle,
  saving,
  compact,
}: {
  permission: PermissionFlags;
  onToggle: (key: keyof PermissionFlags, value: boolean) => void;
  saving?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", saving && "opacity-60")}>
      {PERMISSION_ITEMS.map((item) => (
        <label key={item.key} className="flex flex-col items-center gap-1" title={item.label}>
          {!compact && <item.Icon className="h-3.5 w-3.5 text-ink-400" />}
          <Switch size="sm" checked={permission[item.key]} onCheckedChange={(v) => onToggle(item.key, v)} />
        </label>
      ))}
    </div>
  );
}
