"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { insertReturning } from "@/db/helpers";
import { departments, folders, documents } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { departmentSchema } from "@/lib/validations";
import { slugify, ok, fail, type ActionResult } from "@/lib/utils";
import { deleteStoredFile } from "@/lib/files";

export async function createDepartment(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<ActionResult<{ id: string }>> {
  const admin = await requireSuperAdmin();
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const baseSlug = slugify(parsed.data.name) || "department";
  let slug = baseSlug;
  let attempt = 1;
  while (await db.select().from(departments).where(eq(departments.slug, slug)).then((r) => r.length > 0)) {
    slug = `${baseSlug}-${++attempt}`;
  }

  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${departments.sortOrder}), 0)` })
    .from(departments);

  const created = await insertReturning(departments, {
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    color: parsed.data.color,
    icon: parsed.data.icon,
    sortOrder: (maxRow?.max ?? 0) + 1,
    createdById: admin.id,
  });

  await logAudit({
    action: "DEPARTMENT_CREATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "department",
    targetId: created.id,
    targetLabel: created.name,
  });

  revalidatePath("/departments");
  revalidatePath("/admin/departments");
  return ok({ id: created.id });
}

export async function updateDepartment(
  id: string,
  input: { name: string; description?: string; color?: string; icon?: string }
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [existing] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  if (!existing) return fail("Department not found.");

  await db
    .update(departments)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      icon: parsed.data.icon,
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id));

  await logAudit({
    action: "DEPARTMENT_UPDATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "department",
    targetId: id,
    targetLabel: parsed.data.name,
  });

  revalidatePath("/departments");
  revalidatePath("/admin/departments");
  revalidatePath(`/departments/${id}`);
  return ok();
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const [existing] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  if (!existing) return fail("Department not found.");

  const docs = await db
    .select({ storedFileName: documents.storedFileName })
    .from(documents)
    .innerJoin(folders, eq(folders.id, documents.folderId))
    .where(eq(folders.departmentId, id));

  await db.delete(departments).where(eq(departments.id, id));

  for (const doc of docs) {
    await deleteStoredFile(doc.storedFileName);
  }

  await logAudit({
    action: "DEPARTMENT_DELETED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "department",
    targetId: id,
    targetLabel: existing.name,
    details: `Removed along with all of its folders and ${docs.length} document(s).`,
  });

  revalidatePath("/departments");
  revalidatePath("/admin/departments");
  return ok();
}
