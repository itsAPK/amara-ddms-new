"use server";

import { revalidatePath } from "next/cache";
import { eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { insertReturning } from "@/db/helpers";
import { folders, documents } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { folderSchema } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/lib/utils";
import { deleteStoredFile } from "@/lib/files";
import { getDescendantFolderIds } from "@/lib/permissions";

export async function createFolder(input: {
  name: string;
  departmentId: string;
  parentId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const admin = await requireSuperAdmin();
  const parsed = folderSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${folders.sortOrder}), 0)` })
    .from(folders)
    .where(eq(folders.departmentId, parsed.data.departmentId));

  const created = await insertReturning(folders, {
    name: parsed.data.name,
    departmentId: parsed.data.departmentId,
    parentId: parsed.data.parentId || null,
    sortOrder: (maxRow?.max ?? 0) + 1,
    createdById: admin.id,
  });

  await logAudit({
    action: "FOLDER_CREATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "folder",
    targetId: created.id,
    targetLabel: created.name,
  });

  revalidatePath(`/departments/${parsed.data.departmentId}`);
  revalidatePath(`/folders/${parsed.data.parentId}`);
  return ok({ id: created.id });
}

export async function renameFolder(id: string, name: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = folderSchema.shape.name.safeParse(name);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [existing] = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
  if (!existing) return fail("Folder not found.");

  await db.update(folders).set({ name: parsed.data, updatedAt: new Date() }).where(eq(folders.id, id));

  await logAudit({
    action: "FOLDER_UPDATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "folder",
    targetId: id,
    targetLabel: parsed.data,
  });

  revalidatePath(`/departments/${existing.departmentId}`);
  revalidatePath(`/folders/${id}`);
  if (existing.parentId) revalidatePath(`/folders/${existing.parentId}`);
  return ok();
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const [existing] = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
  if (!existing) return fail("Folder not found.");

  const descendantIds = await getDescendantFolderIds(id);
  const docs = await db
    .select({ storedFileName: documents.storedFileName })
    .from(documents)
    .where(inArray(documents.folderId, descendantIds));

  await db.delete(folders).where(eq(folders.id, id));

  for (const doc of docs) {
    await deleteStoredFile(doc.storedFileName);
  }

  await logAudit({
    action: "FOLDER_DELETED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "folder",
    targetId: id,
    targetLabel: existing.name,
    details: `Removed along with ${descendantIds.length - 1} subfolder(s) and ${docs.length} document(s).`,
  });

  revalidatePath(`/departments/${existing.departmentId}`);
  if (existing.parentId) revalidatePath(`/folders/${existing.parentId}`);
  return ok();
}
