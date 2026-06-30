"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FolderRow } from "@/components/folders/folder-row";
import { DocumentRow } from "@/components/documents/document-row";
import { NewFolderModal, RenameFolderModal } from "@/components/folders/folder-modals";
import { UploadDocumentModal } from "@/components/documents/upload-modal";
import { EditDocumentModal, ReplaceDocumentModal } from "@/components/documents/edit-replace-modals";
import { PreviewDocumentModal } from "@/components/documents/preview-modal";
import { deleteFolder } from "@/lib/actions/folders";
import { deleteDocument } from "@/lib/actions/documents";
import { FolderOpen, Folders } from "lucide-react";
import type { PermissionFlags } from "@/db/schema";
import type { DocumentListItem } from "@/lib/documents-query";

export interface SubfolderItem {
  id: string;
  name: string;
  documentCount: number;
  childCount: number;
}

export function FolderBrowser({
  departmentId,
  currentFolderId,
  currentFolderPermission,
  isAdmin,
  subfolders,
  documents,
}: {
  departmentId: string;
  currentFolderId: string | null;
  currentFolderPermission: PermissionFlags | null;
  isAdmin: boolean;
  subfolders: SubfolderItem[];
  documents: DocumentListItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<SubfolderItem | null>(null);
  const [previewTarget, setPreviewTarget] = React.useState<DocumentListItem | null>(null);
  const [editTarget, setEditTarget] = React.useState<DocumentListItem | null>(null);
  const [replaceTarget, setReplaceTarget] = React.useState<DocumentListItem | null>(null);

  const canUpload = isAdmin || !!currentFolderPermission?.canUpload;

  async function handleDeleteFolder(folder: SubfolderItem) {
    const sure = await confirm({
      title: `Delete "${folder.name}"?`,
      description:
        folder.childCount > 0 || folder.documentCount > 0
          ? `This removes ${folder.childCount} subfolder(s) and ${folder.documentCount} document(s) inside it. This can't be undone.`
          : "This can't be undone.",
      confirmLabel: "Delete folder",
    });
    if (!sure) return;
    const result = await deleteFolder(folder.id);
    if (!result.success) {
      toast({ title: "Couldn't delete folder", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Folder deleted", variant: "success" });
    router.refresh();
  }

  async function handleDeleteDocument(doc: DocumentListItem) {
    const sure = await confirm({
      title: `Delete "${doc.title}"?`,
      description: "This permanently removes the file and its version history.",
      confirmLabel: "Delete document",
    });
    if (!sure) return;
    const result = await deleteDocument(doc.id);
    if (!result.success) {
      toast({ title: "Couldn't delete document", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Document deleted", variant: "success" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
            <Folders className="h-4 w-4 text-ink-400" /> Folders
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" icon={<FolderPlus className="h-3.5 w-3.5" />} onClick={() => setNewFolderOpen(true)}>
              New folder
            </Button>
          )}
        </div>
        {subfolders.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-6 w-6" />}
            title="No subfolders here"
            description={isAdmin ? "Create a folder to start organizing documents." : "Nothing has been added to this area yet."}
          />
        ) : (
          <div className="divide-y divide-paper-line">
            {subfolders.map((f) => (
              <FolderRow
                key={f.id}
                id={f.id}
                name={f.name}
                documentCount={f.documentCount}
                childCount={f.childCount}
                isAdmin={isAdmin}
                onRename={() => setRenameTarget(f)}
                onDelete={() => handleDeleteFolder(f)}
              />
            ))}
          </div>
        )}
      </Card>

      {currentFolderId && currentFolderPermission && (
        <Card>
          <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
            <p className="text-[13px] font-medium text-ink-700">Documents</p>
            {canUpload && (
              <Button size="sm" icon={<UploadCloud className="h-3.5 w-3.5" />} onClick={() => setUploadOpen(true)}>
                Upload
              </Button>
            )}
          </div>
          {documents.length === 0 ? (
            <EmptyState
              icon={<UploadCloud className="h-6 w-6" />}
              title="No documents yet"
              description={canUpload ? "Upload the first document to this folder." : "Check back later for new documents."}
            />
          ) : (
            <div className="divide-y divide-paper-line">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  permission={currentFolderPermission}
                  onPreview={() => setPreviewTarget(doc)}
                  onEdit={() => setEditTarget(doc)}
                  onReplace={() => setReplaceTarget(doc)}
                  onDelete={() => handleDeleteDocument(doc)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      <NewFolderModal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        departmentId={departmentId}
        parentId={currentFolderId}
      />
      {renameTarget && (
        <RenameFolderModal
          open={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          folderId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
      {currentFolderId && <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={currentFolderId} />}
      {previewTarget && currentFolderPermission && (
        <PreviewDocumentModal
          open={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          document={previewTarget}
          canDownload={currentFolderPermission.canDownload}
        />
      )}
      {editTarget && (
        <EditDocumentModal open={!!editTarget} onClose={() => setEditTarget(null)} document={editTarget} />
      )}
      {replaceTarget && (
        <ReplaceDocumentModal open={!!replaceTarget} onClose={() => setReplaceTarget(null)} document={replaceTarget} />
      )}
    </div>
  );
}
