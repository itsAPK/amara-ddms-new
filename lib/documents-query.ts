import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { documents, documentVersions, users } from "@/db/schema";
import type { FileType } from "@/db/schema";

export interface DocumentListItem {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  version: number;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedByName: string | null;
}

export async function getDocumentsInFolder(folderId: string): Promise<DocumentListItem[]> {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      fileName: documents.fileName,
      fileType: documents.fileType,
      fileSize: documents.fileSize,
      version: documents.version,
      folderId: documents.folderId,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      uploadedByName: users.name,
    })
    .from(documents)
    .leftJoin(users, eq(users.id, documents.uploadedById))
    .where(eq(documents.folderId, folderId))
    .orderBy(desc(documents.createdAt));
}

export interface DocumentVersionItem {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  createdAt: Date;
  uploadedByName: string | null;
}

export async function getDocumentVersionHistory(documentId: string): Promise<DocumentVersionItem[]> {
  return db
    .select({
      id: documentVersions.id,
      version: documentVersions.version,
      fileName: documentVersions.fileName,
      fileSize: documentVersions.fileSize,
      createdAt: documentVersions.createdAt,
      uploadedByName: users.name,
    })
    .from(documentVersions)
    .leftJoin(users, eq(users.id, documentVersions.uploadedById))
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version));
}
