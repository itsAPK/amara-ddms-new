"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  departments,
  folders,
  departmentPermissions,
  folderPermissions,
  users,
  type PermissionFlags,
  type Folder,
} from "@/db/schema";
import { requireSuperAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { permissionFlagsSchema } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/lib/utils";

export interface FolderPermissionNode extends Folder {
  override: PermissionFlags | null;
  children: FolderPermissionNode[];
}

export interface DepartmentPermissionView {
  department: { id: string; name: string; color: string; icon: string };
  permission: PermissionFlags | null;
  folders: FolderPermissionNode[];
}

function flags(row: PermissionFlags): PermissionFlags {
  return {
    canView: row.canView,
    canUpload: row.canUpload,
    canEdit: row.canEdit,
    canDelete: row.canDelete,
    canDownload: row.canDownload,
  };
}

/** Full permission matrix for the admin UI: every department + its folder tree, with this user's current grants. */
export async function getUserPermissionMatrix(targetUserId: string): Promise<DepartmentPermissionView[]> {
  await requireSuperAdmin();

  const allDepartments = await db.select().from(departments).orderBy(departments.sortOrder, departments.name);
  const allFolders = await db.select().from(folders).orderBy(folders.sortOrder, folders.name);
  const deptPerms = await db
    .select()
    .from(departmentPermissions)
    .where(eq(departmentPermissions.userId, targetUserId));
  const folderPerms = await db.select().from(folderPermissions).where(eq(folderPermissions.userId, targetUserId));

  const deptPermMap = new Map(deptPerms.map((p) => [p.departmentId, flags(p)]));
  const folderPermMap = new Map(folderPerms.map((p) => [p.folderId, flags(p)]));

  function buildTree(departmentId: string, parentId: string | null): FolderPermissionNode[] {
    return allFolders
      .filter((f) => f.departmentId === departmentId && f.parentId === parentId)
      .map((f) => ({
        ...f,
        override: folderPermMap.get(f.id) ?? null,
        children: buildTree(departmentId, f.id),
      }));
  }

  return allDepartments.map((dept) => ({
    department: { id: dept.id, name: dept.name, color: dept.color, icon: dept.icon },
    permission: deptPermMap.get(dept.id) ?? null,
    folders: buildTree(dept.id, null),
  }));
}

export async function setDepartmentPermission(
  targetUserId: string,
  departmentId: string,
  input: PermissionFlags
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = permissionFlagsSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid permission values.");

  const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  const [dept] = await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1);
  if (!target || !dept) return fail("User or department not found.");

  const [existing] = await db
    .select()
    .from(departmentPermissions)
    .where(and(eq(departmentPermissions.userId, targetUserId), eq(departmentPermissions.departmentId, departmentId)))
    .limit(1);

  if (existing) {
    await db
      .update(departmentPermissions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(departmentPermissions.id, existing.id));
  } else {
    await db.insert(departmentPermissions).values({
      userId: targetUserId,
      departmentId,
      ...parsed.data,
    });
  }

  await logAudit({
    action: "PERMISSION_CHANGED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "department_permission",
    targetId: departmentId,
    targetLabel: `${target.email} — ${dept.name}`,
    details: JSON.stringify(parsed.data),
  });

  revalidatePath(`/admin/users/${targetUserId}/permissions`);
  return ok();
}

export async function setFolderPermission(
  targetUserId: string,
  folderId: string,
  input: PermissionFlags
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = permissionFlagsSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid permission values.");

  const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!target || !folder) return fail("User or folder not found.");

  const [existing] = await db
    .select()
    .from(folderPermissions)
    .where(and(eq(folderPermissions.userId, targetUserId), eq(folderPermissions.folderId, folderId)))
    .limit(1);

  if (existing) {
    await db
      .update(folderPermissions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(folderPermissions.id, existing.id));
  } else {
    await db.insert(folderPermissions).values({
      userId: targetUserId,
      folderId,
      ...parsed.data,
    });
  }

  await logAudit({
    action: "PERMISSION_CHANGED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "folder_permission",
    targetId: folderId,
    targetLabel: `${target.email} — ${folder.name}`,
    details: JSON.stringify(parsed.data),
  });

  revalidatePath(`/admin/users/${targetUserId}/permissions`);
  return ok();
}

export async function clearFolderPermissionOverride(
  targetUserId: string,
  folderId: string
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  await db
    .delete(folderPermissions)
    .where(and(eq(folderPermissions.userId, targetUserId), eq(folderPermissions.folderId, folderId)));

  await logAudit({
    action: "PERMISSION_CHANGED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "folder_permission",
    targetId: folderId,
    targetLabel: "Reverted to inherited permission",
  });

  revalidatePath(`/admin/users/${targetUserId}/permissions`);
  return ok();
}
