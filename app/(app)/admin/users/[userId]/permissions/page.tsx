import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/session";
import { getUserPermissionMatrix } from "@/lib/actions/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { Eye, Upload, Pencil, Trash2, Download } from "lucide-react";

export default async function UserPermissionsPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireSuperAdmin();
  const { userId } = await params;

  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) notFound();

  const matrix = await getUserPermissionMatrix(userId);

  return (
    <div className="pb-12">
      <div className="px-6 pt-6 sm:px-8">
        <Breadcrumb items={[{ label: "Users & Access", href: "/admin/users" }, { label: targetUser.name }]} />
      </div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={targetUser.name} />
            {targetUser.name}
            <Badge variant={targetUser.role === "SUPER_ADMIN" ? "warning" : "default"}>
              {targetUser.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
            </Badge>
          </span>
        }
        description={`Set what ${targetUser.name.split(" ")[0]} can see and do, by department or by individual folder.`}
      />

      {targetUser.role === "SUPER_ADMIN" ? (
        <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-800 sm:mx-8">
          Super Admins automatically have full access everywhere. Permission overrides aren&rsquo;t needed for this account.
        </div>
      ) : (
        <>
          <div className="mx-6 mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-paper-line bg-white px-5 py-3 text-[12px] text-ink-500 sm:mx-8">
            <span className="font-medium text-ink-700">Legend:</span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> View
            </span>
            <span className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload
            </span>
            <span className="flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </span>
            <span className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </span>
            <span className="ml-auto text-ink-400">
              Set a department toggle to apply it to every folder inside, then override individual folders as needed.
            </span>
          </div>

          <div className="px-6 pt-4 sm:px-8">
            <PermissionMatrix userId={userId} matrix={matrix} />
          </div>
        </>
      )}
    </div>
  );
}
