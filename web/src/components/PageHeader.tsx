import type { ReactNode } from "react";

/**
 * The top bar of a settings page: title and one line of help on the left, the main action
 * on the right, a rule underneath. It runs the full width of the content, edge to edge.
 * `back` goes above the title, e.g. a link back to the list a page came from.
 */
export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="-mx-4 mb-6 max-w-none! border-b px-4 pb-4 md:-mx-8 md:px-8 md:pt-6">
      {back}
      {/* only the text wraps; the action stays at the right on every page */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-xl leading-tight font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] text-pretty text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

/** The lime "Add …" button on settings pages, the same size as New booking */
export const pageAction = "font-semibold";
