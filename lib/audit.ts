import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs, type AuditAction } from "@/db/schema";

interface LogAuditInput {
  action: AuditAction;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: string;
}

/** Best-effort client IP lookup from common proxy headers. */
async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}

export async function logAudit(input: LogAuditInput) {
  const ipAddress = await getClientIp();
  await db.insert(auditLogs).values({
    action: input.action,
    userId: input.userId ?? null,
    userName: input.userName ?? null,
    userEmail: input.userEmail ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    targetLabel: input.targetLabel ?? null,
    details: input.details ?? null,
    ipAddress,
  });
}
