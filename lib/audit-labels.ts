import type { AuditAction } from "@/db/schema";

export const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILED: "Failed sign-in attempt",
  LOGOUT: "Signed out",
  PASSWORD_CHANGED: "Changed password",
  PASSWORD_RESET: "Reset a user's password",
  USER_CREATED: "Created a user account",
  USER_UPDATED: "Updated a user account",
  USER_ACTIVATED: "Activated a user account",
  USER_DEACTIVATED: "Deactivated a user account",
  PERMISSION_CHANGED: "Updated access permissions",
  DEPARTMENT_CREATED: "Created a department",
  DEPARTMENT_UPDATED: "Updated a department",
  DEPARTMENT_DELETED: "Deleted a department",
  FOLDER_CREATED: "Created a folder",
  FOLDER_UPDATED: "Renamed a folder",
  FOLDER_DELETED: "Deleted a folder",
  DOCUMENT_UPLOADED: "Uploaded a document",
  DOCUMENT_UPDATED: "Edited document details",
  DOCUMENT_REPLACED: "Replaced a document file",
  DOCUMENT_DELETED: "Deleted a document",
  DOCUMENT_VIEWED: "Previewed a document",
  DOCUMENT_DOWNLOADED: "Downloaded a document",
};

export const ACTION_BADGE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  LOGIN_SUCCESS: "success",
  LOGIN_FAILED: "danger",
  LOGOUT: "default",
  PASSWORD_CHANGED: "info",
  PASSWORD_RESET: "warning",
  USER_CREATED: "success",
  USER_UPDATED: "info",
  USER_ACTIVATED: "success",
  USER_DEACTIVATED: "warning",
  PERMISSION_CHANGED: "info",
  DEPARTMENT_CREATED: "success",
  DEPARTMENT_UPDATED: "info",
  DEPARTMENT_DELETED: "danger",
  FOLDER_CREATED: "success",
  FOLDER_UPDATED: "info",
  FOLDER_DELETED: "danger",
  DOCUMENT_UPLOADED: "success",
  DOCUMENT_UPDATED: "info",
  DOCUMENT_REPLACED: "info",
  DOCUMENT_DELETED: "danger",
  DOCUMENT_VIEWED: "default",
  DOCUMENT_DOWNLOADED: "default",
};

export function actionLabel(action: AuditAction | string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}
