import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { ACTION_LABELS } from "@/lib/audit-labels";

interface ActivityItem {
  id: string;
  action: string;
  userName: string | null;
  targetLabel: string | null;
  createdAt: Date;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="h-6 w-6" />}
        title="No activity yet"
        description="User and document activity will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-paper-line">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 px-5 py-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-ink-800">
              <span className="font-medium">{item.userName ?? "Someone"}</span>{" "}
              {ACTION_LABELS[item.action]?.toLowerCase() ?? item.action.toLowerCase().replace(/_/g, " ")}
              {item.targetLabel && <span className="text-ink-500"> · {item.targetLabel}</span>}
            </p>
            <p className="text-[11.5px] text-ink-400">{timeAgo(item.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
