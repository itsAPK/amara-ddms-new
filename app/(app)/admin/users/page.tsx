import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export default async function AdminUsersPage() {
  const admin = await requireSuperAdmin();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="pb-10">
      <PageHeader title="Users & Access" description="Create accounts and control who can see what." />
      <div className="px-6 pt-2 sm:px-8">
        <AdminUsersView users={allUsers} currentUserId={admin.id} />
      </div>
    </div>
  );
}
