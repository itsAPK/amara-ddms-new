"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Plus } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ICON_NAMES, DeptIcon } from "@/lib/icon-map";
import { createDepartment, updateDepartment } from "@/lib/actions/departments";
import { cn } from "@/lib/utils";
import type { Department } from "@/db/schema";

const COLOR_OPTIONS = ["#2f6b5f", "#dd7a2e", "#1f5247", "#9c4a18", "#163e36", "#7eaba2", "#c2611f", "#0b2e2a"];

export function DepartmentModal({
  open,
  onClose,
  department,
}: {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!department;

  const [name, setName] = React.useState(department?.name ?? "");
  const [description, setDescription] = React.useState(department?.description ?? "");
  const [color, setColor] = React.useState(department?.color ?? COLOR_OPTIONS[0]);
  const [icon, setIcon] = React.useState(department?.icon ?? ICON_NAMES[0]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
      setColor(department?.color ?? COLOR_OPTIONS[0]);
      setIcon(department?.icon ?? ICON_NAMES[0]);
    }
  }, [open, department]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = isEdit
      ? await updateDepartment(department!.id, { name, description, color, icon })
      : await createDepartment({ name, description, color, icon });
    setLoading(false);
    if (!result.success) {
      toast({ title: "Couldn't save department", description: result.error, variant: "error" });
      return;
    }
    toast({ title: isEdit ? "Department updated" : "Department created", variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          title={isEdit ? "Edit department" : "New department"}
          description="Departments are the top-level menus everyone navigates from."
          onClose={onClose}
        />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="dept-name">Name</Label>
            <Input id="dept-name" required placeholder="e.g. Pharmacy" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dept-description">Description (optional)</Label>
            <Textarea
              id="dept-description"
              rows={2}
              placeholder="What lives in this department?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    color === c ? "scale-110 border-ink-700" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg border transition-colors",
                    icon === iconName ? "border-ink-600 bg-ink-50 text-ink-800" : "border-paper-line text-ink-400 hover:bg-paper-dim/60"
                  )}
                >
                  <DeptIcon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={isEdit ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}>
            {isEdit ? "Save changes" : "Create department"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
