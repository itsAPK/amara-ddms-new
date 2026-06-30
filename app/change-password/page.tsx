import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <ChangePasswordForm forced={user.mustChangePassword} />
    </div>
  );
}
