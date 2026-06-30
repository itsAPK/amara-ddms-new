"use server";

import { revalidatePath } from "next/cache";
import { eq, sql, ne, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { insertReturning } from "@/db/helpers";
import { users } from "@/db/schema";
import { requireSuperAdmin, requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { createUserSchema, updateUserSchema, changePasswordSchema } from "@/lib/validations";
import { ok, fail, generateTempPassword, type ActionResult } from "@/lib/utils";

const BCRYPT_ROUNDS = 12;

export async function createUser(input: {
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "USER";
  password: string;
}): Promise<ActionResult<{ id: string }>> {
  const admin = await requireSuperAdmin();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${parsed.data.email})`)
    .limit(1);
  if (existing) return fail("A user with this email already exists.");

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

  const created = await insertReturning(users, {
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    mustChangePassword: true,
    createdById: admin.id,
  });

  await logAudit({
    action: "USER_CREATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "user",
    targetId: created.id,
    targetLabel: created.email,
    details: `Role: ${created.role}`,
  });

  revalidatePath("/admin/users");
  return ok({ id: created.id });
}

export async function updateUser(
  id: string,
  input: { name: string; email: string; role: "SUPER_ADMIN" | "USER" }
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return fail("User not found.");

  const [conflict] = await db
    .select()
    .from(users)
    .where(and(sql`lower(${users.email}) = lower(${parsed.data.email})`, ne(users.id, id)))
    .limit(1);
  if (conflict) return fail("Another user already uses this email.");

  if (existing.role === "SUPER_ADMIN" && parsed.data.role === "USER") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "SUPER_ADMIN"));
    if (Number(count) <= 1) return fail("At least one Super Admin must remain.");
  }

  await db
    .update(users)
    .set({ name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id));

  await logAudit({
    action: "USER_UPDATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "user",
    targetId: id,
    targetLabel: parsed.data.email,
  });

  revalidatePath("/admin/users");
  return ok();
}

export async function setUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return fail("User not found.");

  if (existing.id === admin.id && !isActive) return fail("You can't deactivate your own account.");

  if (existing.role === "SUPER_ADMIN" && !isActive) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "SUPER_ADMIN"), eq(users.isActive, true)));
    if (Number(count) <= 1) return fail("At least one active Super Admin must remain.");
  }

  await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));

  await logAudit({
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "user",
    targetId: id,
    targetLabel: existing.email,
  });

  revalidatePath("/admin/users");
  return ok();
}

export async function resetUserPassword(id: string): Promise<ActionResult<{ tempPassword: string }>> {
  const admin = await requireSuperAdmin();
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return fail("User not found.");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
    .where(eq(users.id, id));

  await logAudit({
    action: "PASSWORD_RESET",
    userId: admin.id,
    userName: admin.name,
    userEmail: admin.email,
    targetType: "user",
    targetId: id,
    targetLabel: existing.email,
    details: "Reset by Super Admin",
  });

  revalidatePath("/admin/users");
  return ok({ tempPassword });
}

/** Self-service password change, required on first login or any time after. */
export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0].message);

  const [existing] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!existing) return fail("User not found.");

  const valid = await bcrypt.compare(parsed.data.currentPassword, existing.passwordHash);
  if (!valid) return fail("Your current password is incorrect.");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logAudit({
    action: "PASSWORD_CHANGED",
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    targetType: "user",
    targetId: user.id,
  });

  return ok();
}
