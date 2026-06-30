import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .default("#2f6b5f"),
  icon: z.string().trim().min(1).default("FolderKanban"),
});

export const folderSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  departmentId: z.string().min(1),
  parentId: z.string().nullable().optional(),
});

export const documentMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(["SUPER_ADMIN", "USER"]),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(["SUPER_ADMIN", "USER"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const permissionFlagsSchema = z.object({
  canView: z.boolean(),
  canUpload: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canDownload: z.boolean(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type FolderInput = z.infer<typeof folderSchema>;
export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
