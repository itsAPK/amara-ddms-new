"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, RefreshCw } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FileDropZone } from "@/components/documents/file-drop-zone";
import { updateDocumentMeta, replaceDocument } from "@/lib/actions/documents";
import type { DocumentListItem } from "@/lib/documents-query";

export function EditDocumentModal({
  open,
  onClose,
  document,
}: {
  open: boolean;
  onClose: () => void;
  document: DocumentListItem;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState(document.title);
  const [description, setDescription] = React.useState(document.description ?? "");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(document.title);
      setDescription(document.description ?? "");
    }
  }, [open, document]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateDocumentMeta(document.id, { title, description });
    setLoading(false);
    if (!result.success) {
      toast({ title: "Couldn't save changes", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Document updated", variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <DialogHeader title="Edit document details" onClose={onClose} />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<Save className="h-3.5 w-3.5" />}>
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export function ReplaceDocumentModal({
  open,
  onClose,
  document,
}: {
  open: boolean;
  onClose: () => void;
  document: DocumentListItem;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast({ title: "Choose a replacement file", variant: "error" });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("id", document.id);
    formData.set("file", file);
    const result = await replaceDocument(formData);
    setLoading(false);
    if (!result.success) {
      toast({ title: "Couldn't replace file", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "File replaced", description: `Now on version ${document.version + 1}.`, variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          title="Replace file"
          description={`Currently "${document.fileName}" (v${document.version}). The previous version is kept in history.`}
          onClose={onClose}
        />
        <DialogBody>
          <FileDropZone file={file} onFileSelected={setFile} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Replace file
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
