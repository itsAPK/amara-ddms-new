"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { DocumentRow } from "@/components/documents/document-row";
import { PreviewDocumentModal } from "@/components/documents/preview-modal";
import { EditDocumentModal, ReplaceDocumentModal } from "@/components/documents/edit-replace-modals";
import { searchDocuments, type SearchResultItem } from "@/lib/actions/search";
import { FILE_TYPES, type FileType } from "@/db/schema";
import type { DocumentListItem } from "@/lib/documents-query";

function toDocumentListItem(r: SearchResultItem): DocumentListItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    fileName: r.fileName,
    fileType: r.fileType,
    fileSize: r.fileSize,
    version: r.version,
    folderId: r.folderId,
    createdAt: r.createdAt,
    updatedAt: r.createdAt,
    uploadedByName: r.uploadedByName,
  };
}

export function SearchView({ departments }: { departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [fileType, setFileType] = React.useState(searchParams.get("type") ?? "");
  const [departmentId, setDepartmentId] = React.useState(searchParams.get("dept") ?? "");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewTarget, setPreviewTarget] = React.useState<SearchResultItem | null>(null);
  const [editTarget, setEditTarget] = React.useState<SearchResultItem | null>(null);
  const [replaceTarget, setReplaceTarget] = React.useState<SearchResultItem | null>(null);
  const [searched, setSearched] = React.useState(false);

  React.useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (!q && !fileType && !departmentId) return;
    runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(q: string) {
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchDocuments({ q, fileType: (fileType as FileType) || undefined, departmentId: departmentId || undefined });
      setResults(res);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (fileType) params.set("type", fileType);
    if (departmentId) params.set("dept", departmentId);
    router.replace(`/search?${params.toString()}`);
    runSearch(query);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          icon={<SearchIcon className="h-4 w-4" />}
          placeholder="Search by document name, keyword, department, or folder…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:flex-1"
        />
        <div className="flex gap-2.5">
          <Select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-36">
            <option value="">All file types</option>
            {FILE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-44">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <div className="py-16">
            <Spinner className="mx-auto h-6 w-6" />
          </div>
        ) : !searched ? (
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title="Search across everything you can access"
            description="Find documents by name, keyword, department, folder, or file type."
          />
        ) : results.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-6 w-6" />} title="No matching documents" description="Try a different keyword or remove a filter." />
        ) : (
          <Card>
            <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5 text-[13px] font-medium text-ink-700">
              <span>
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="divide-y divide-paper-line">
              {results.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center justify-between px-5 pt-2.5 text-[11.5px] text-ink-400">
                    <span>
                      {r.departmentName} / {r.folderName}
                    </span>
                  </div>
                  <DocumentRow
                    document={toDocumentListItem(r)}
                    permission={r.permission}
                    onPreview={() => setPreviewTarget(r)}
                    onEdit={() => setEditTarget(r)}
                    onReplace={() => setReplaceTarget(r)}
                    onDelete={() => {}}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {previewTarget && (
        <PreviewDocumentModal
          open={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          document={toDocumentListItem(previewTarget)}
          canDownload={previewTarget.permission.canDownload}
        />
      )}
      {editTarget && (
        <EditDocumentModal open={!!editTarget} onClose={() => setEditTarget(null)} document={toDocumentListItem(editTarget)} />
      )}
      {replaceTarget && (
        <ReplaceDocumentModal open={!!replaceTarget} onClose={() => setReplaceTarget(null)} document={toDocumentListItem(replaceTarget)} />
      )}
    </div>
  );
}
