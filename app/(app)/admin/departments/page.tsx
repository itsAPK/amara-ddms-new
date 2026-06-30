import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { AdminDepartmentsView } from "@/components/admin/admin-departments-view";

export default async function AdminDepartmentsPage() {
  await requireSuperAdmin();
  const allDepartments = await db.select().from(departments).orderBy(departments.sortOrder, departments.name);

  return (
    <div className="pb-10">
      <PageHeader title="Departments" description="Create and manage the top-level departments everyone navigates from." />
      <div className="px-6 pt-2 sm:px-8">
        <AdminDepartmentsView departments={allDepartments} />
      </div>
    </div>
  );
}
