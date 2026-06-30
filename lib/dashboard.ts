import "server-only";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { departments, documents, folders, users, auditLogs } from "@/db/schema";
import type { SessionUser } from "@/lib/session";
import { getAllViewableFolderIds, getAccessibleDepartments } from "@/lib/permissions";

export interface RecentUpload {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  folderId: string;
  folderName: string;
  departmentName: string;
  departmentColor: string;
  createdAt: Date;
  uploadedByName: string | null;
}

export interface AdminDashboardData {
  totalDepartments: number;
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  recentUploads: RecentUpload[];
  recentActivity: { id: string; action: string; userName: string | null; targetLabel: string | null; createdAt: Date }[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [[{ deptCount }], [{ userCount }], [{ activeCount }], [{ docCount }]] = await Promise.all([
    db.select({ deptCount: sql<number>`count(*)` }).from(departments),
    db.select({ userCount: sql<number>`count(*)` }).from(users),
    db.select({ activeCount: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true)),
    db.select({ docCount: sql<number>`count(*)` }).from(documents),
  ]);

  const recentUploads = await db
    .select({
      id: documents.id,
      title: documents.title,
      fileType: documents.fileType,
      fileSize: documents.fileSize,
      folderId: documents.folderId,
      folderName: folders.name,
      departmentName: departments.name,
      departmentColor: departments.color,
      createdAt: documents.createdAt,
      uploadedByName: users.name,
    })
    .from(documents)
    .innerJoin(folders, eq(folders.id, documents.folderId))
    .innerJoin(departments, eq(departments.id, folders.departmentId))
    .leftJoin(users, eq(users.id, documents.uploadedById))
    .orderBy(desc(documents.createdAt))
    .limit(8);

  const recentActivity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      userName: auditLogs.userName,
      targetLabel: auditLogs.targetLabel,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  return {
    totalDepartments: Number(deptCount),
    totalUsers: Number(userCount),
    activeUsers: Number(activeCount),
    totalDocuments: Number(docCount),
    recentUploads,
    recentActivity,
  };
}

export interface UserDashboardData {
  accessibleDepartments: { id: string; name: string; color: string; icon: string; slug: string }[];
  recentDocuments: RecentUpload[];
}

export async function getUserDashboardData(user: SessionUser): Promise<UserDashboardData> {
  const accessibleDepartments = await getAccessibleDepartments(user);
  const viewableFolderIds = await getAllViewableFolderIds(user);

  const recentDocuments = viewableFolderIds.length
    ? await db
        .select({
          id: documents.id,
          title: documents.title,
          fileType: documents.fileType,
          fileSize: documents.fileSize,
          folderId: documents.folderId,
          folderName: folders.name,
          departmentName: departments.name,
          departmentColor: departments.color,
          createdAt: documents.createdAt,
          uploadedByName: users.name,
        })
        .from(documents)
        .innerJoin(folders, eq(folders.id, documents.folderId))
        .innerJoin(departments, eq(departments.id, folders.departmentId))
        .leftJoin(users, eq(users.id, documents.uploadedById))
        .where(inArray(documents.folderId, viewableFolderIds))
        .orderBy(desc(documents.createdAt))
        .limit(8)
    : [];

  return {
    accessibleDepartments: accessibleDepartments.map((d) => ({
      id: d.id,
      name: d.name,
      color: d.color,
      icon: d.icon,
      slug: d.slug,
    })),
    recentDocuments,
  };
}
