import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getAccessibleDepartments } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentGrid } from "@/components/departments/department-grid";
import { Button } from "@/components/ui/button";

export default async function DepartmentsPage() {
  const user = await requireUser();
  const departments = await getAccessibleDepartments(user);

  return (
    <div className="pb-10">
      <PageHeader
        title="Departments"
        description="Browse documents organized by department."
        actions={
          user.role === "SUPER_ADMIN" ? (
            <Link href="/admin/departments">
              <Button variant="outline" size="sm" icon={<Settings2 className="h-3.5 w-3.5" />}>
                Manage departments
              </Button>
            </Link>
          ) : undefined
        }
      />
      <div className="px-6 pt-4 sm:px-8">
        <DepartmentGrid
          departments={departments.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            color: d.color,
            icon: d.icon,
          }))}
        />
      </div>
    </div>
  );
}
