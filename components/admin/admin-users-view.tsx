"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Pencil, KeyRound, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { UserModal } from "@/components/admin/user-modal";
import { CredentialDialog } from "@/components/admin/credential-dialog";
import { setUserActive, resetUserPassword } from "@/lib/actions/users";
import { formatDate, timeAgo } from "@/lib/utils";
import { Users as UsersIcon } from "lucide-react";
import type { User } from "@/db/schema";

export function AdminUsersView({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [query, setQuery] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(null);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  async function handleToggleActive(user: User) {
    if (!user.isActive) {
      const result = await setUserActive(user.id, true);
      if (!result.success) return toast({ title: "Couldn't activate user", description: result.error, variant: "error" });
      toast({ title: "User activated", variant: "success" });
      router.refresh();
      return;
    }
    const sure = await confirm({
      title: `Deactivate ${user.name}?`,
      description: "They'll immediately lose the ability to sign in. You can reactivate them anytime.",
      confirmLabel: "Deactivate",
    });
    if (!sure) return;
    const result = await setUserActive(user.id, false);
    if (!result.success) return toast({ title: "Couldn't deactivate user", description: result.error, variant: "error" });
    toast({ title: "User deactivated", variant: "success" });
    router.refresh();
  }

  async function handleResetPassword(user: User) {
    const sure = await confirm({
      title: `Reset password for ${user.name}?`,
      description: "A new temporary password will be generated and they'll be asked to change it on next sign-in.",
      confirmLabel: "Reset password",
      variant: "primary",
    });
    if (!sure) return;
    const result = await resetUserPassword(user.id);
    if (!result.success || !result.data) {
      toast({ title: "Couldn't reset password", description: result.error, variant: "error" });
      return;
    }
    setCredentials({ email: user.email, password: result.data.tempPassword });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Button
          size="sm"
          icon={<UserPlus className="h-3.5 w-3.5" />}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          New user
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="No users found" />
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-paper-line bg-white shadow-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-paper-line bg-paper-dim/40 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3">User</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Last login</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {filtered.map((user) => (
                <tr key={user.id} className="text-[13.5px] text-ink-800">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">{user.name}</p>
                        <p className="truncate text-[12px] text-ink-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={user.role === "SUPER_ADMIN" ? "warning" : "default"}>
                      {user.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => handleToggleActive(user)}
                      size="sm"
                      disabled={user.id === currentUserId}
                    />
                  </td>
                  <td className="px-3 py-3 text-ink-500">{user.lastLoginAt ? timeAgo(user.lastLoginAt) : "Never"}</td>
                  <td className="px-3 py-3 text-ink-500">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/users/${user.id}/permissions`}
                        title="Manage access"
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleResetPassword(user)}
                        title="Reset password"
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(user);
                          setModalOpen(true);
                        }}
                        title="Edit"
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editing}
        onCreated={(password, email) => setCredentials({ email, password })}
      />
      {credentials && (
        <CredentialDialog
          open={!!credentials}
          onClose={() => setCredentials(null)}
          email={credentials.email}
          password={credentials.password}
        />
      )}
    </div>
  );
}
