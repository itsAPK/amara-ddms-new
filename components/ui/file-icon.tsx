import { FileText, FileSpreadsheet, Presentation, Image as ImageIcon, File } from "lucide-react";
import type { FileType } from "@/db/schema";
import { cn } from "@/lib/utils";

const STYLES: Record<FileType, { bg: string; fg: string; Icon: typeof File; label: string }> = {
  PDF: { bg: "bg-red-50", fg: "text-red-600", Icon: FileText, label: "PDF" },
  DOC: { bg: "bg-sky-50", fg: "text-sky-600", Icon: FileText, label: "DOC" },
  DOCX: { bg: "bg-sky-50", fg: "text-sky-600", Icon: FileText, label: "DOCX" },
  XLS: { bg: "bg-emerald-50", fg: "text-emerald-600", Icon: FileSpreadsheet, label: "XLS" },
  XLSX: { bg: "bg-emerald-50", fg: "text-emerald-600", Icon: FileSpreadsheet, label: "XLSX" },
  PPT: { bg: "bg-orange-50", fg: "text-orange-600", Icon: Presentation, label: "PPT" },
  PPTX: { bg: "bg-orange-50", fg: "text-orange-600", Icon: Presentation, label: "PPTX" },
  JPG: { bg: "bg-purple-50", fg: "text-purple-600", Icon: ImageIcon, label: "JPG" },
  JPEG: { bg: "bg-purple-50", fg: "text-purple-600", Icon: ImageIcon, label: "JPEG" },
  PNG: { bg: "bg-purple-50", fg: "text-purple-600", Icon: ImageIcon, label: "PNG" },
};

export function FileIcon({ type, size = "md" }: { type: FileType; size?: "sm" | "md" | "lg" }) {
  const style = STYLES[type] ?? STYLES.PDF;
  const dim = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const iconDim = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg", dim, style.bg, style.fg)}>
      <style.Icon className={iconDim} strokeWidth={1.75} />
    </div>
  );
}

export function fileTypeLabel(type: FileType): string {
  return STYLES[type]?.label ?? type;
}
