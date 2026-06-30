"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DepartmentModal } from "@/components/admin/department-modal";
import { DeptIcon } from "@/lib/icon-map";
import { deleteDepartment } from "@/lib/actions/departments";
import { Library } from "lucide-react";
import type { Department } from "@/db/schema";

export function AdminDepartmentsView({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);

  async function handleDelete(dept: Department) {
    const sure = await confirm({
      title: `Delete "${dept.name}"?`,
      description: "This permanently removes the department, every folder inside it, and every document. This can't be undone.",
      confirmLabel: "Delete department",
    });
    if (!sure) return;
    const result = await deleteDepartment(dept.id);
    if (!result.success) {
      toast({ title: "Couldn't delete department", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Department deleted", variant: "success" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          New department
        </Button>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          icon={<Library className="h-6 w-6" />}
          title="No departments yet"
          description="Create your first department, like HR or Quality, to start organizing documents."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="relative flex flex-col overflow-hidden rounded-xl2 border border-paper-line bg-white p-5 shadow-card"
            >
              <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: dept.color }} />
              <div className="flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: dept.color + "14", color: dept.color }}
                >
                  <DeptIcon name={dept.icon} className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditing(dept);
                      setModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 font-display text-[17px] text-ink-900">{dept.name}</h3>
              {dept.description && <p className="mt-1 line-clamp-2 flex-1 text-[13px] text-ink-500">{dept.description}</p>}
              <Link
                href={`/departments/${dept.id}`}
                className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-ink-600 hover:text-ink-900"
              >
                Manage folders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <DepartmentModal open={modalOpen} onClose={() => setModalOpen(false)} department={editing} />
    </div>
  );
}
