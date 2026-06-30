import { Building2, Users, FileStack, UserCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getAdminDashboardData, getUserDashboardData } from "@/lib/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RecentUploadsList } from "@/components/dashboard/recent-uploads";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DepartmentGrid } from "@/components/departments/department-grid";
import { GlobalSearch } from "@/components/layout/global-search";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  if (user.role === "SUPER_ADMIN") {
    const data = await getAdminDashboardData();
    return (
      <div className="pb-10">
        <PageHeader title={`${greeting()}, ${firstName}`} description="Here's what's happening across Amara Hospital's document library." />
        <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
          <StatCard label="Departments" value={data.totalDepartments} icon={<Building2 className="h-[18px] w-[18px]" />} accent="#2f6b5f" delay={0} />
          <StatCard label="Total Users" value={data.totalUsers} icon={<Users className="h-[18px] w-[18px]" />} accent="#dd7a2e" delay={0.04} />
          <StatCard label="Active Users" value={data.activeUsers} icon={<UserCheck className="h-[18px] w-[18px]" />} accent="#1f5247" delay={0.08} />
          <StatCard label="Documents" value={data.totalDocuments} icon={<FileStack className="h-[18px] w-[18px]" />} accent="#9c4a18" delay={0.12} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 px-6 lg:grid-cols-2 sm:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent uploads</CardTitle>
            </CardHeader>
            <RecentUploadsList items={data.recentUploads} />
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User activity</CardTitle>
            </CardHeader>
            <ActivityFeed items={data.recentActivity} />
          </Card>
        </div>
      </div>
    );
  }

  const data = await getUserDashboardData(user);
  return (
    <div className="pb-10">
      <PageHeader title={`${greeting()}, ${firstName}`} description="Pick up where you left off, or search for what you need." />

      <div className="px-6 sm:px-8">
        <div className="sm:hidden">
          <GlobalSearch />
        </div>
      </div>

      <div className="mt-2 px-6 sm:px-8">
        <h2 className="mb-3 font-display text-[16px] text-ink-800">Your departments</h2>
        <DepartmentGrid departments={data.accessibleDepartments} />
      </div>

      <div className="mt-6 px-6 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Recently added documents</CardTitle>
          </CardHeader>
          <RecentUploadsList items={data.recentDocuments} />
        </Card>
      </div>
    </div>
  );
}
