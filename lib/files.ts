import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { detectFileType, UnsupportedFileTypeError } from "@/lib/file-meta";
import type { FileType } from "@/db/schema";
import { v4 as uuidv4 } from 'uuid';

export { mimeForFileType, isPreviewable, detectFileType, UnsupportedFileTypeError, formatFileSize } from "@/lib/file-meta";

export const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

function sanitizeBaseName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .slice(0, 80);
}

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

/** Persists an uploaded File/Blob to disk and returns its on-disk metadata. */
export async function saveUploadedFile(file: File): Promise<{
  fileName: string;
  storedFileName: string;
  fileType: FileType;
  fileSize: number;
}> {
  await ensureStorageDir();
  const fileType = detectFileType(file.name);
  const ext = file.name.split(".").pop()!.toLowerCase();
  const safeBase = sanitizeBaseName(file.name.replace(/\.[^.]+$/, "")) || "document";
  const storedFileName = `${uuidv4()}-${safeBase}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(STORAGE_DIR, storedFileName), buffer);
  return {
    fileName: file.name,
    storedFileName,
    fileType,
    fileSize: buffer.byteLength,
  };
}

export async function deleteStoredFile(storedFileName: string): Promise<void> {
  try {
    await fs.unlink(path.join(STORAGE_DIR, storedFileName));
  } catch {
    // already gone - not fatal
  }
}

export async function readStoredFile(storedFileName: string): Promise<Buffer> {
  return fs.readFile(path.join(STORAGE_DIR, storedFileName));
}
