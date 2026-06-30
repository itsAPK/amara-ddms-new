import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  datetime,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
const id = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4());

const fk = (name: string) => varchar(name, { length: 36 });

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
};

export const ROLES = ["SUPER_ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export const FILE_TYPES = [
  "PDF",
  "DOC",
  "DOCX",
  "XLS",
  "XLSX",
  "PPT",
  "PPTX",
  "JPG",
  "JPEG",
  "PNG",
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const AUDIT_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "PERMISSION_CHANGED",
  "DEPARTMENT_CREATED",
  "DEPARTMENT_UPDATED",
  "DEPARTMENT_DELETED",
  "FOLDER_CREATED",
  "FOLDER_UPDATED",
  "FOLDER_DELETED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_UPDATED",
  "DOCUMENT_REPLACED",
  "DOCUMENT_DELETED",
  "DOCUMENT_VIEWED",
  "DOCUMENT_DOWNLOADED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// NOTE: email uniqueness/lookup relies on the column's case-insensitive
// collation (utf8mb4_unicode_ci, set in db/init.sql) rather than a
// functional lower() index, since that's the more portable approach across
// MySQL/MariaDB versions.
export const users = mysqlTable("users", {
  id: id(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ROLES).notNull().default("USER"),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  createdById: fk("created_by_id"),
  ...timestamps,
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}));

export const departments = mysqlTable("departments", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 16 }).notNull().default("#2f6b5f"),
  icon: varchar("icon", { length: 60 }).notNull().default("FolderKanban"),
  sortOrder: int("sort_order").notNull().default(0),
  createdById: fk("created_by_id").references(() => users.id),
  ...timestamps,
}, (t) => ({
  slugIdx: uniqueIndex("departments_slug_idx").on(t.slug),
}));

export const folders = mysqlTable("folders", {
  id: id(),
  name: varchar("name", { length: 150 }).notNull(),
  departmentId: fk("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  parentId: fk("parent_id"),
  sortOrder: int("sort_order").notNull().default(0),
  createdById: fk("created_by_id").references(() => users.id),
  ...timestamps,
}, (t) => ({
  deptIdx: index("folders_department_idx").on(t.departmentId),
  parentIdx: index("folders_parent_idx").on(t.parentId),
}));

export const documents = mysqlTable("documents", {
  id: id(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  storedFileName: varchar("stored_file_name", { length: 255 }).notNull(),
  fileType: mysqlEnum("file_type", FILE_TYPES).notNull(),
  fileSize: int("file_size").notNull(),
  version: int("version").notNull().default(1),
  folderId: fk("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  uploadedById: fk("uploaded_by_id").references(() => users.id),
  ...timestamps,
}, (t) => ({
  folderIdx: index("documents_folder_idx").on(t.folderId),
}));

export const documentVersions = mysqlTable("document_versions", {
  id: id(),
  documentId: fk("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  version: int("version").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  storedFileName: varchar("stored_file_name", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(),
  uploadedById: fk("uploaded_by_id").references(() => users.id),
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => ({
  docIdx: index("document_versions_document_idx").on(t.documentId),
}));

export const departmentPermissions = mysqlTable("department_permissions", {
  id: id(),
  userId: fk("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  departmentId: fk("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  canView: boolean("can_view").notNull().default(true),
  canUpload: boolean("can_upload").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  canDownload: boolean("can_download").notNull().default(true),
  ...timestamps,
}, (t) => ({
  uniq: uniqueIndex("department_permissions_user_dept_idx").on(t.userId, t.departmentId),
}));

export const folderPermissions = mysqlTable("folder_permissions", {
  id: id(),
  userId: fk("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderId: fk("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  canView: boolean("can_view").notNull().default(true),
  canUpload: boolean("can_upload").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  canDownload: boolean("can_download").notNull().default(true),
  ...timestamps,
}, (t) => ({
  uniq: uniqueIndex("folder_permissions_user_folder_idx").on(t.userId, t.folderId),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: id(),
  userId: fk("user_id"),
  userName: varchar("user_name", { length: 100 }),
  userEmail: varchar("user_email", { length: 255 }),
  action: mysqlEnum("action", AUDIT_ACTIONS).notNull(),
  targetType: varchar("target_type", { length: 60 }),
  targetId: varchar("target_id", { length: 36 }),
  targetLabel: varchar("target_label", { length: 255 }),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => ({
  userIdx: index("audit_logs_user_idx").on(t.userId),
  actionIdx: index("audit_logs_action_idx").on(t.action),
  createdIdx: index("audit_logs_created_idx").on(t.createdAt),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type DepartmentPermission = typeof departmentPermissions.$inferSelect;
export type FolderPermission = typeof folderPermissions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export const PERMISSION_KEYS = [
  "canView",
  "canUpload",
  "canEdit",
  "canDelete",
  "canDownload",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export interface PermissionFlags {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export const NO_ACCESS: PermissionFlags = {
  canView: false,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
};

export const FULL_ACCESS: PermissionFlags = {
  canView: true,
  canUpload: true,
  canEdit: true,
  canDelete: true,
  canDownload: true,
};
