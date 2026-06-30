"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Lock, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changeOwnPassword } from "@/lib/actions/users";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await changeOwnPassword({ currentPassword, newPassword, confirmPassword });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setSuccess(true);
    await update({});
    setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-[400px] rounded-2xl border border-paper-line bg-white p-8 shadow-card"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h1 className="mt-4 font-display text-xl text-ink-900">
        {forced ? "Set a new password" : "Change your password"}
      </h1>
      <p className="mt-1.5 text-[13.5px] text-ink-500">
        {forced
          ? "This is your first time signing in. Choose a new password to continue."
          : "Update the password used to sign in to your account."}
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Password updated. Redirecting…
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            required
            icon={<Lock className="h-4 w-4" />}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            required
            icon={<Lock className="h-4 w-4" />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="mt-1 text-[11.5px] text-ink-400">8+ characters, with an uppercase letter and a number.</p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            icon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
        Update password
      </Button>
    </motion.form>
  );
}
