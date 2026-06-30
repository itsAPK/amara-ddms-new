import { requireUser } from "@/lib/session";
import { getAccessibleDepartments } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const departments = await getAccessibleDepartments(user);

  return (
    <AppShell
      user={user}
      departments={departments.map((d) => ({ id: d.id, name: d.name, color: d.color, icon: d.icon }))}
    >
      {children}
    </AppShell>
  );
}
