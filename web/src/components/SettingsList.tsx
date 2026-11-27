import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The bordered list on settings pages: one card, rows split by hairlines, and from md up
 * a quiet header naming the columns. `columns` is the md+ grid template, shared by the
 * header and every row so they line up.
 */
export function SettingsList({
  columns,
  headings,
  children,
}: {
  columns: string; // e.g. "md:grid-cols-[1fr_7rem_8rem_auto]"
  headings: string[]; // one per column; "" for the actions column
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        aria-hidden
        className={cn(
          "hidden gap-4 border-b bg-background px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid",
          columns,
        )}
      >
        {headings.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
      <ul className="divide-y">{children}</ul>
    </div>
  );
}

/** One row. On a phone the cells stack beside the actions; from md up they sit in columns */
export function SettingsRow({
  columns,
  children,
  actions,
}: {
  columns: string;
  children: ReactNode; // the data cells
  actions: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 px-4 py-3 md:grid md:min-h-14",
        columns,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:contents">
        {children}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1">
        {actions}
      </div>
    </li>
  );
}

/** Placeholder rows while the list loads: grey bars where the names and details will be */
export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <ul className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex min-h-14 items-center gap-4 px-4 py-3">
            <span className="h-3.5 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <span className="h-3.5 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </div>
  );
}
