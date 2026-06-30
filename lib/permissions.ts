import "server-only";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  departments,
  folders,
  departmentPermissions,
  folderPermissions,
  type Department,
  type Folder,
  type PermissionFlags,
} from "@/db/schema";
import { NO_ACCESS, FULL_ACCESS } from "@/db/schema";
import type { SessionUser } from "@/lib/session";

export type FolderNode = Folder & {
  permission: PermissionFlags;
  children: FolderNode[];
  documentCount: number;
};

/**
 * Resolves a user's effective permission for a single folder.
 * Most-specific wins: an explicit folder permission beats the
 * department-wide default, which beats "no access".
 */
export async function resolveFolderPermission(
  user: SessionUser,
  folderId: string
): Promise<PermissionFlags> {
  if (user.role === "SUPER_ADMIN") return { ...FULL_ACCESS };

  const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!folder) return { ...NO_ACCESS };

  const [explicit] = await db
    .select()
    .from(folderPermissions)
    .where(and(eq(folderPermissions.userId, user.id), eq(folderPermissions.folderId, folderId)))
    .limit(1);

  if (explicit) return extractFlags(explicit);

  const [deptPerm] = await db
    .select()
    .from(departmentPermissions)
    .where(
      and(
        eq(departmentPermissions.userId, user.id),
        eq(departmentPermissions.departmentId, folder.departmentId)
      )
    )
    .limit(1);

  if (deptPerm) return extractFlags(deptPerm);

  return { ...NO_ACCESS };
}

export async function resolveDepartmentPermission(
  user: SessionUser,
  departmentId: string
): Promise<PermissionFlags> {
  if (user.role === "SUPER_ADMIN") return { ...FULL_ACCESS };

  const [deptPerm] = await db
    .select()
    .from(departmentPermissions)
    .where(
      and(eq(departmentPermissions.userId, user.id), eq(departmentPermissions.departmentId, departmentId))
    )
    .limit(1);

  return deptPerm ? extractFlags(deptPerm) : { ...NO_ACCESS };
}

function extractFlags(row: PermissionFlags): PermissionFlags {
  return {
    canView: row.canView,
    canUpload: row.canUpload,
    canEdit: row.canEdit,
    canDelete: row.canDelete,
    canDownload: row.canDownload,
  };
}

/** Departments the user can see at all (direct dept perm, or perm on any folder within). */
export async function getAccessibleDepartments(user: SessionUser): Promise<Department[]> {
  const all = await db.select().from(departments).orderBy(departments.sortOrder, departments.name);
  if (user.role === "SUPER_ADMIN") return all;

  const deptPerms = await db
    .select()
    .from(departmentPermissions)
    .where(eq(departmentPermissions.userId, user.id));
  const viewableDeptIds = new Set(deptPerms.filter((p) => p.canView).map((p) => p.departmentId));

  const folderPerms = await db
    .select()
    .from(folderPermissions)
    .where(eq(folderPermissions.userId, user.id));
  if (folderPerms.some((p) => p.canView)) {
    const folderIds = folderPerms.filter((p) => p.canView).map((p) => p.folderId);
    if (folderIds.length > 0) {
      const owningFolders = await db.select().from(folders).where(inArray(folders.id, folderIds));
      owningFolders.forEach((f) => viewableDeptIds.add(f.departmentId));
    }
  }

  return all.filter((d) => viewableDeptIds.has(d.id));
}

/**
 * Builds the visible folder tree for a department, applying inherited
 * permissions top-down. A folder with no view access (after inheritance)
 * prunes its entire subtree.
 */
export async function buildVisibleFolderTree(
  user: SessionUser,
  departmentId: string
): Promise<FolderNode[]> {
  const allFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.departmentId, departmentId))
    .orderBy(folders.sortOrder, folders.name);

  const counts = await getDocumentCountsByFolder(allFolders.map((f) => f.id));

  if (user.role === "SUPER_ADMIN") {
    return nest(allFolders, null, () => ({ ...FULL_ACCESS }), counts);
  }

  const deptDefault = await resolveDepartmentPermission(user, departmentId);

  const explicitRows = await db
    .select()
    .from(folderPermissions)
    .where(eq(folderPermissions.userId, user.id));
  const explicitMap = new Map(explicitRows.map((r) => [r.folderId, extractFlags(r)]));

  function walk(parentId: string | null, inherited: PermissionFlags): FolderNode[] {
    return allFolders
      .filter((f) => f.parentId === parentId)
      .map((f) => {
        const effective = explicitMap.get(f.id) ?? inherited;
        const children = walk(f.id, effective);
        const node: FolderNode = {
          ...f,
          permission: effective,
          children,
          documentCount: counts.get(f.id) ?? 0,
        };
        return node;
      })
      .filter((node) => node.permission.canView || node.children.length > 0);
  }

  return walk(null, deptDefault);
}

function nest(
  allFolders: Folder[],
  parentId: string | null,
  permFn: () => PermissionFlags,
  counts: Map<string, number>
): FolderNode[] {
  return allFolders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({
      ...f,
      permission: permFn(),
      children: nest(allFolders, f.id, permFn, counts),
      documentCount: counts.get(f.id) ?? 0,
    }));
}

async function getDocumentCountsByFolder(folderIds: string[]): Promise<Map<string, number>> {
  if (folderIds.length === 0) return new Map();
  const { documents } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");
  const rows = await db
    .select({ folderId: documents.folderId, count: sql<number>`count(*)` })
    .from(documents)
    .where(inArray(documents.folderId, folderIds))
    .groupBy(documents.folderId);
  return new Map(rows.map((r) => [r.folderId, Number(r.count)]));
}

/** Returns the breadcrumb chain from department root down to (and including) this folder. */
export async function getFolderBreadcrumb(folderId: string): Promise<Folder[]> {
  const chain: Folder[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const [f] = await db.select().from(folders).where(eq(folders.id, currentId)).limit(1);
    if (!f) break;
    chain.unshift(f);
    currentId = f.parentId;
  }
  return chain;
}

/** All folder ids under (and including) a folder - used for cascading delete checks / search scoping. */
export async function getDescendantFolderIds(folderId: string): Promise<string[]> {
  const all = await db.select().from(folders);
  const result: string[] = [folderId];
  let frontier = [folderId];
  while (frontier.length) {
    const next = all.filter((f) => f.parentId && frontier.includes(f.parentId)).map((f) => f.id);
    result.push(...next);
    frontier = next;
  }
  return result;
}

/** All folder ids the user can at least view, across every department - used for search. */
export async function getAllViewableFolderIds(user: SessionUser): Promise<string[]> {
  if (user.role === "SUPER_ADMIN") {
    const all = await db.select({ id: folders.id }).from(folders);
    return all.map((f) => f.id);
  }

  const accessibleDepartments = await getAccessibleDepartments(user);
  const ids: string[] = [];
  for (const dept of accessibleDepartments) {
    const tree = await buildVisibleFolderTree(user, dept.id);
    flatten(tree, ids);
  }
  return ids;
}

/** Finds the children array for a given parent id within an already-built folder tree (null = top level). */
export function findNodeChildren(tree: FolderNode[], parentId: string | null): FolderNode[] {
  if (parentId === null) return tree;
  return findNode(tree, parentId)?.children ?? [];
}

/** Finds a single node by id within a built folder tree. */
export function findNode(tree: FolderNode[], id: string): FolderNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function flatten(nodes: FolderNode[], out: string[]) {
  for (const n of nodes) {
    if (n.permission.canView) out.push(n.id);
    flatten(n.children, out);
  }
}
