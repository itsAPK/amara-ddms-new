import "server-only";
import { and, desc, eq, gte, lte, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, type AuditAction } from "@/db/schema";

export interface AuditLogFilters {
  action?: AuditAction;
  userQuery?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  rows: (typeof auditLogs.$inferSelect)[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function queryAuditLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 25;

  const conditions = [];
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.userQuery) {
    const term = `%${filters.userQuery.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${auditLogs.userName}) like ${term} or lower(${auditLogs.userEmail}) like ${term})`
    );
  }
  if (filters.from) conditions.push(gte(auditLogs.createdAt, new Date(filters.from)));
  if (filters.to) {
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, end));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(whereClause);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    rows,
    total: Number(count),
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(Number(count) / pageSize)),
  };
}
