import * as React from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-7 pb-2 sm:px-8">
      <div>
        <h1 className="font-display text-[24px] text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
