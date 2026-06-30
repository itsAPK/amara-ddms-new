"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, UserPlus, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createUser, updateUser } from "@/lib/actions/users";
import type { User } from "@/db/schema";

export function UserModal({
  open,
  onClose,
  user,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onCreated?: (tempPassword: string, email: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!user;

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [role, setRole] = React.useState<"SUPER_ADMIN" | "USER">(user?.role ?? "USER");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setRole(user?.role ?? "USER");
      setPassword("");
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (isEdit) {
      const result = await updateUser(user!.id, { name, email, role });
      setLoading(false);
      if (!result.success) {
        toast({ title: "Couldn't save user", description: result.error, variant: "error" });
        return;
      }
      toast({ title: "User updated", variant: "success" });
      onClose();
      router.refresh();
    } else {
      const result = await createUser({ name, email, role, password });
      setLoading(false);
      if (!result.success) {
        toast({ title: "Couldn't create user", description: result.error, variant: "error" });
        return;
      }
      toast({ title: "User created", description: `${email} can now sign in.`, variant: "success" });
      onClose();
      onCreated?.(password, email);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          title={isEdit ? "Edit user" : "New user"}
          description={isEdit ? undefined : "They'll be asked to set a new password on first sign-in."}
          onClose={onClose}
        />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="user-name">Full name</Label>
            <Input id="user-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-email">Email address</Label>
            <Input id="user-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-role">Role</Label>
            <Select id="user-role" value={role} onChange={(e) => setRole(e.target.value as "SUPER_ADMIN" | "USER")}>
              <option value="USER">Staff User</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
            <p className="mt-1 text-[11.5px] text-ink-400">
              {role === "SUPER_ADMIN"
                ? "Full access to every department, folder, and the admin console."
                : "Access is limited to departments and folders you assign."}
            </p>
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="user-password">Temporary password</Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} icon={isEdit ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}>
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
