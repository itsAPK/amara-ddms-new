import Link from "next/link";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { requireSuperAdmin } from "@/lib/session";
import { queryAuditLogs } from "@/lib/audit-query";
import { AUDIT_ACTIONS, type AuditAction } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { actionLabel, ACTION_BADGE_VARIANT } from "@/lib/audit-labels";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const result = await queryAuditLogs({
    action: sp.action as AuditAction | undefined,
    userQuery: sp.user,
    from: sp.from,
    to: sp.to,
    page,
  });

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (sp.action) params.set("action", sp.action);
    if (sp.user) params.set("user", sp.user);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    params.set("page", String(p));
    return `/admin/audit-logs?${params.toString()}`;
  }

  return (
    <div className="pb-12">
      <PageHeader title="Audit Logs" description="Every sign-in, upload, edit, and permission change, in one trail." />

      <div className="px-6 pt-2 sm:px-8">
        <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl2 border border-paper-line bg-white p-4 shadow-card" method="get">
          <div className="w-44">
            <label className="mb-1.5 block text-[12px] font-medium text-ink-600">Action</label>
            <Select name="action" defaultValue={sp.action ?? ""}>
              <option value="">All actions</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {actionLabel(a)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label className="mb-1.5 block text-[12px] font-medium text-ink-600">User name or email</label>
            <Input name="user" defaultValue={sp.user ?? ""} placeholder="e.g. asha" />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-[12px] font-medium text-ink-600">From</label>
            <Input type="date" name="from" defaultValue={sp.from ?? ""} />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-[12px] font-medium text-ink-600">To</label>
            <Input type="date" name="to" defaultValue={sp.to ?? ""} />
          </div>
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          {(sp.action || sp.user || sp.from || sp.to) && (
            <Link href="/admin/audit-logs" className="text-[12.5px] text-ink-500 hover:text-ink-800 hover:underline">
              Clear
            </Link>
          )}
        </form>

        {result.rows.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No activity matches these filters" />
        ) : (
          <div className="overflow-hidden rounded-xl2 border border-paper-line bg-white shadow-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-paper-line bg-paper-dim/40 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">When</th>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="px-3 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {result.rows.map((log) => (
                  <tr key={log.id} className="text-[13px] text-ink-700">
                    <td className="px-5 py-3 font-mono text-[12px] text-ink-500">{formatDateTime(log.createdAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-ink-900">{log.userName ?? "—"}</p>
                      <p className="text-[11.5px] text-ink-500">{log.userEmail}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={ACTION_BADGE_VARIANT[log.action] ?? "default"}>{actionLabel(log.action)}</Badge>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{log.targetLabel ?? log.details ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11.5px] text-ink-400">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-paper-line px-5 py-3">
              <p className="text-[12.5px] text-ink-500">
                Page {result.page} of {result.totalPages} · {result.total} total
              </p>
              <div className="flex gap-1.5">
                <Link href={pageHref(Math.max(1, page - 1))}>
                  <Button variant="outline" size="sm" disabled={page <= 1} icon={<ChevronLeft className="h-3.5 w-3.5" />}>
                    Prev
                  </Button>
                </Link>
                <Link href={pageHref(Math.min(result.totalPages, page + 1))}>
                  <Button variant="outline" size="sm" disabled={page >= result.totalPages}>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
