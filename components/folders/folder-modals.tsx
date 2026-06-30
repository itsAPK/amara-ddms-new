"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createFolder, renameFolder } from "@/lib/actions/folders";

export function NewFolderModal({
  open,
  onClose,
  departmentId,
  parentId,
}: {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setName("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createFolder({ name, departmentId, parentId });
    setLoading(false);
    if (!result.success) {
      toast({ title: "Couldn't create folder", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Folder created", variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <DialogHeader title="New folder" description="Add a subfolder to organize documents." onClose={onClose} />
        <DialogBody>
          <Label htmlFor="folder-name">Folder name</Label>
          <Input
            id="folder-name"
            autoFocus
            required
            placeholder="e.g. Infection Control Policies"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<FolderPlus className="h-3.5 w-3.5" />}>
            Create folder
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export function RenameFolderModal({
  open,
  onClose,
  folderId,
  currentName,
}: {
  open: boolean;
  onClose: () => void;
  folderId: string;
  currentName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState(currentName);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await renameFolder(folderId, name);
    setLoading(false);
    if (!result.success) {
      toast({ title: "Couldn't rename folder", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Folder renamed", variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <DialogHeader title="Rename folder" onClose={onClose} />
        <DialogBody>
          <Label htmlFor="rename-folder">Folder name</Label>
          <Input id="rename-folder" autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            Save
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
