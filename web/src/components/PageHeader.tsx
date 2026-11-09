import type { ReactNode } from "react";

/** The title row of a settings page: heading and one line of help, the main action at the right */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      {/* only the text wraps; the action stays at the right on every page */}
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** The blue "Add …" button on settings pages, the same size as New booking */
export const pageAction =
  "h-9 px-3.5 font-semibold shadow-[0_1px_2px_rgba(13,58,158,0.25)]";
