import type { FileType } from "@/db/schema";
import { FILE_TYPES } from "@/db/schema";

const EXTENSION_TO_TYPE: Record<string, FileType> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  ppt: "PPT",
  pptx: "PPTX",
  jpg: "JPG",
  jpeg: "JPEG",
  png: "PNG",
};

const MIME_BY_TYPE: Record<FileType, string> = {
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLS: "application/vnd.ms-excel",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  PPT: "application/vnd.ms-powerpoint",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  JPG: "image/jpeg",
  JPEG: "image/jpeg",
  PNG: "image/png",
};

export function mimeForFileType(type: FileType): string {
  return MIME_BY_TYPE[type] ?? "application/octet-stream";
}

export function isPreviewable(type: FileType): boolean {
  return type === "PDF" || type === "JPG" || type === "JPEG" || type === "PNG";
}

export class UnsupportedFileTypeError extends Error {
  constructor(ext: string) {
    super(
      `"${ext || "unknown"}" files aren't supported. Allowed types: ${FILE_TYPES.join(", ")}.`
    );
    this.name = "UnsupportedFileTypeError";
  }
}

export function detectFileType(originalFileName: string): FileType {
  const ext = originalFileName.split(".").pop()?.toLowerCase() ?? "";
  const type = EXTENSION_TO_TYPE[ext];
  if (!type) throw new UnsupportedFileTypeError(ext);
  return type;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
