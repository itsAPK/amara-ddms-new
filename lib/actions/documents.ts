"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { insertReturning } from "@/db/helpers";
import { documents, documentVersions, folders } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { documentMetaSchema } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/lib/utils";
import { saveUploadedFile, deleteStoredFile, UnsupportedFileTypeError } from "@/lib/files";
import { resolveFolderPermission } from "@/lib/permissions";
import { getDocumentVersionHistory, type DocumentVersionItem } from "@/lib/documents-query";

export async function getVersionHistory(documentId: string): Promise<ActionResult<DocumentVersionItem[]>> {
  const user = await requireUser();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return fail("Document not found.");

  const permission = await resolveFolderPermission(user, doc.folderId);
  if (!permission.canView) return fail("You don't have permission to view this document.");

  const versions = await getDocumentVersionHistory(documentId);
  return ok(versions);
}

export async function uploadDocument(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const folderId = String(formData.get("folderId") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const file = formData.get("file") as File | null;

  if (!folderId) return fail("Choose a folder for this document.");
  if (!file || file.size === 0) return fail("Select a file to upload.");

  const meta = documentMetaSchema.safeParse({ title, description });
  if (!meta.success) return fail(meta.error.errors[0].message);

  const permission = await resolveFolderPermission(user, folderId);
  if (!permission.canUpload) return fail("You don't have permission to upload to this folder.");

  const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!folder) return fail("Folder not found.");

  let saved;
  try {
    saved = await saveUploadedFile(file);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) return fail(err.message);
    throw err;
  }

  const created = await insertReturning(documents, {
    title: meta.data.title,
    description: meta.data.description || null,
    fileName: saved.fileName,
    storedFileName: saved.storedFileName,
    fileType: saved.fileType,
    fileSize: saved.fileSize,
    folderId,
    uploadedById: user.id,
  });

  await logAudit({
    action: "DOCUMENT_UPLOADED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "document",
    targetId: created.id,
    targetLabel: created.title,
    details: `Uploaded to folder "${folder.name}" (${saved.fileType}, ${saved.fileSize} bytes).`,
  });

  revalidatePath(`/folders/${folderId}`);
  revalidatePath(`/departments/${folder.departmentId}`);
  revalidatePath("/dashboard");
  return ok({ id: created.id });
}

export async function updateDocumentMeta(
  id: string,
  input: { title: string; description?: string }
): Promise<ActionResult> {
  const user = await requireUser();
  const meta = documentMetaSchema.safeParse(input);
  if (!meta.success) return fail(meta.error.errors[0].message);

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return fail("Document not found.");

  const permission = await resolveFolderPermission(user, doc.folderId);
  if (!permission.canEdit) return fail("You don't have permission to edit this document.");

  await db
    .update(documents)
    .set({ title: meta.data.title, description: meta.data.description || null, updatedAt: new Date() })
    .where(eq(documents.id, id));

  await logAudit({
    action: "DOCUMENT_UPDATED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "document",
    targetId: id,
    targetLabel: meta.data.title,
  });

  revalidatePath(`/folders/${doc.folderId}`);
  return ok();
}

export async function replaceDocument(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("file") as File | null;
  if (!id) return fail("Missing document.");
  if (!file || file.size === 0) return fail("Select a replacement file.");

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return fail("Document not found.");

  const permission = await resolveFolderPermission(user, doc.folderId);
  if (!permission.canEdit) return fail("You don't have permission to replace this document.");

  let saved;
  try {
    saved = await saveUploadedFile(file);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) return fail(err.message);
    throw err;
  }

  await db.insert(documentVersions).values({
    documentId: doc.id,
    version: doc.version,
    fileName: doc.fileName,
    storedFileName: doc.storedFileName,
    fileSize: doc.fileSize,
    uploadedById: doc.uploadedById,
  });

  await db
    .update(documents)
    .set({
      fileName: saved.fileName,
      storedFileName: saved.storedFileName,
      fileType: saved.fileType,
      fileSize: saved.fileSize,
      version: doc.version + 1,
      uploadedById: user.id,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));

  await logAudit({
    action: "DOCUMENT_REPLACED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "document",
    targetId: id,
    targetLabel: doc.title,
    details: `Replaced version ${doc.version} with version ${doc.version + 1}.`,
  });

  revalidatePath(`/folders/${doc.folderId}`);
  return ok();
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return fail("Document not found.");

  const permission = await resolveFolderPermission(user, doc.folderId);
  if (!permission.canDelete) return fail("You don't have permission to delete this document.");

  const oldVersions = await db
    .select({ storedFileName: documentVersions.storedFileName })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id));

  await db.delete(documents).where(eq(documents.id, id));

  await deleteStoredFile(doc.storedFileName);
  for (const v of oldVersions) await deleteStoredFile(v.storedFileName);

  await logAudit({
    action: "DOCUMENT_DELETED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "document",
    targetId: id,
    targetLabel: doc.title,
  });

  revalidatePath(`/folders/${doc.folderId}`);
  revalidatePath("/dashboard");
  return ok();
}
