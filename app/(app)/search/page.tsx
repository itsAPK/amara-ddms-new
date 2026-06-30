import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { getAccessibleDepartments } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { SearchView } from "@/components/search/search-view";
import { PageSpinner } from "@/components/ui/spinner";

export default async function SearchPage() {
  const user = await requireUser();
  const departments = await getAccessibleDepartments(user);

  return (
    <div className="pb-10">
      <PageHeader title="Search" description="Find documents across every department you can access." />
      <div className="px-6 pt-2 sm:px-8">
        <Suspense fallback={<PageSpinner />}>
          <SearchView departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
        </Suspense>
      </div>
    </div>
  );
}
