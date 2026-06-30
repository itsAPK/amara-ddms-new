import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { buildVisibleFolderTree, resolveDepartmentPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FolderBrowser, type SubfolderItem } from "@/components/folders/folder-browser";
import { DeptIcon } from "@/lib/icon-map";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const user = await requireUser();

  const [dept] = await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1);
  if (!dept) notFound();

  const isAdmin = user.role === "SUPER_ADMIN";
  const tree = await buildVisibleFolderTree(user, departmentId);

  if (!isAdmin) {
    const deptPermission = await resolveDepartmentPermission(user, departmentId);
    if (!deptPermission.canView && tree.length === 0) notFound();
  }

  const subfolders: SubfolderItem[] = tree.map((node) => ({
    id: node.id,
    name: node.name,
    documentCount: node.documentCount,
    childCount: node.children.length,
  }));

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 sm:px-8">
        <Breadcrumb items={[{ label: dept.name }]} />
      </div>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: dept.color + "14", color: dept.color }}
            >
              <DeptIcon name={dept.icon} className="h-4 w-4" />
            </span>
            {dept.name}
          </span>
        }
        description={dept.description ?? undefined}
      />
      <div className="px-6 pt-2 sm:px-8">
        <FolderBrowser
          departmentId={dept.id}
          currentFolderId={null}
          currentFolderPermission={null}
          isAdmin={isAdmin}
          subfolders={subfolders}
          documents={[]}
        />
      </div>
    </div>
  );
}
