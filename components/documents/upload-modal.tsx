"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FileDropZone } from "@/components/documents/file-drop-zone";
import { uploadDocument } from "@/lib/actions/documents";

export function UploadDocumentModal({
  open,
  onClose,
  folderId,
}: {
  open: boolean;
  onClose: () => void;
  folderId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setFile(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast({ title: "Choose a file to upload", variant: "error" });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("folderId", folderId);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("file", file);
    const result = await uploadDocument(formData);
    setLoading(false);
    if (!result.success) {
      toast({ title: "Upload failed", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Document uploaded", variant: "success" });
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <DialogHeader title="Upload document" description="Add a new file to this folder." onClose={onClose} />
        <DialogBody className="space-y-4">
          <FileDropZone file={file} onFileSelected={setFile} />
          <div>
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              required
              placeholder="e.g. Hand Hygiene Policy 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="doc-description">Description (optional)</Label>
            <Textarea
              id="doc-description"
              rows={3}
              placeholder="Short note about this document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={<UploadCloud className="h-3.5 w-3.5" />}>
            Upload
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
