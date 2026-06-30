"use server";

import { inArray, or, like, eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { documents, folders, departments, users, type FileType, type PermissionFlags } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { getAllViewableFolderIds, resolveFolderPermission } from "@/lib/permissions";

export interface SearchResultItem {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  version: number;
  createdAt: Date;
  folderId: string;
  folderName: string;
  departmentId: string;
  departmentName: string;
  departmentColor: string;
  uploadedByName: string | null;
  permission: PermissionFlags;
}

export interface SearchFilters {
  q?: string;
  departmentId?: string;
  fileType?: FileType;
}

export async function searchDocuments(filters: SearchFilters): Promise<SearchResultItem[]> {
  const user = await requireUser();
  const viewableFolderIds = await getAllViewableFolderIds(user);
  if (viewableFolderIds.length === 0) return [];

  const conditions = [inArray(documents.folderId, viewableFolderIds)];

  const q = filters.q?.trim();
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    conditions.push(
      or(
        like(documents.title, term),
        like(documents.description, term),
        like(documents.fileName, term),
        like(folders.name, term),
        like(departments.name, term)
      )!
    );
  }
  if (filters.departmentId) conditions.push(eq(departments.id, filters.departmentId));
  if (filters.fileType) conditions.push(eq(documents.fileType, filters.fileType));

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      fileName: documents.fileName,
      fileType: documents.fileType,
      fileSize: documents.fileSize,
      version: documents.version,
      createdAt: documents.createdAt,
      folderId: documents.folderId,
      folderName: folders.name,
      departmentId: departments.id,
      departmentName: departments.name,
      departmentColor: departments.color,
      uploadedByName: users.name,
    })
    .from(documents)
    .innerJoin(folders, eq(folders.id, documents.folderId))
    .innerJoin(departments, eq(departments.id, folders.departmentId))
    .leftJoin(users, eq(users.id, documents.uploadedById))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt))
    .limit(100);

  const permissionCache = new Map<string, PermissionFlags>();
  const result: SearchResultItem[] = [];
  for (const row of rows) {
    let permission = permissionCache.get(row.folderId);
    if (!permission) {
      permission = await resolveFolderPermission(user, row.folderId);
      permissionCache.set(row.folderId, permission);
    }
    result.push({ ...row, permission });
  }

  return result;
}
