import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { resolveFolderPermission } from "@/lib/permissions";
import { readStoredFile, mimeForFileType, isPreviewable } from "@/lib/files";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permission = await resolveFolderPermission(user, doc.folderId);
  if (!permission.canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isPreviewable(doc.fileType)) {
    return NextResponse.json({ error: "This file type has no inline preview." }, { status: 415 });
  }

  const buffer = await readStoredFile(doc.storedFileName);

  await logAudit({
    action: "DOCUMENT_VIEWED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "document",
    targetId: doc.id,
    targetLabel: doc.title,
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeForFileType(doc.fileType),
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
