import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireUser } from "@/lib/session";
import {
  buildVisibleFolderTree,
  resolveFolderPermission,
  getFolderBreadcrumb,
  findNodeChildren,
} from "@/lib/permissions";
import { getDocumentsInFolder } from "@/lib/documents-query";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FolderBrowser, type SubfolderItem } from "@/components/folders/folder-browser";

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  const user = await requireUser();

  const breadcrumbFolders = await getFolderBreadcrumb(folderId);
  if (breadcrumbFolders.length === 0) notFound();
  const currentFolder = breadcrumbFolders[breadcrumbFolders.length - 1];

  const [dept] = await db.select().from(departments).where(eq(departments.id, currentFolder.departmentId)).limit(1);
  if (!dept) notFound();

  const isAdmin = user.role === "SUPER_ADMIN";
  const permission = await resolveFolderPermission(user, folderId);
  if (!isAdmin && !permission.canView) notFound();

  const tree = await buildVisibleFolderTree(user, currentFolder.departmentId);
  const childNodes = findNodeChildren(tree, folderId);
  const subfolders: SubfolderItem[] = childNodes.map((node) => ({
    id: node.id,
    name: node.name,
    documentCount: node.documentCount,
    childCount: node.children.length,
  }));

  const documents = await getDocumentsInFolder(folderId);

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 sm:px-8">
        <Breadcrumb
          items={[
            { label: dept.name, href: `/departments/${dept.id}` },
            ...breadcrumbFolders.map((f, i) => ({
              label: f.name,
              href: i === breadcrumbFolders.length - 1 ? undefined : `/folders/${f.id}`,
            })),
          ]}
        />
      </div>
      <PageHeader title={currentFolder.name} />
      <div className="px-6 pt-2 sm:px-8">
        <FolderBrowser
          departmentId={currentFolder.departmentId}
          currentFolderId={folderId}
          currentFolderPermission={isAdmin ? { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true } : permission}
          isAdmin={isAdmin}
          subfolders={subfolders}
          documents={documents}
        />
      </div>
    </div>
  );
}
