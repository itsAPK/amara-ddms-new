import { GlobalSearch } from "@/components/layout/global-search";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/session";

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-paper-line bg-white/80 px-6 backdrop-blur-sm">
      <GlobalSearch />
      <UserMenu name={user.name} email={user.email} role={user.role} />
    </header>
  );
}
