import { cn } from "@/lib/utils";
import {
  clockLabel,
  formatDuration,
  staffStatus,
  type StaffStatus,
  type Timeline,
} from "./timeline";

type Props = {
  timeline: Timeline;
  now: number; // minutes into today, in the business's timezone
};

/**
 * Today only: one card per staff member saying what they're doing right now and
 * what's next, so the owner doesn't have to find the now line on the grid.
 */
export function StatusStrip({ timeline, now }: Props) {
  // removed staff only appear for their old bookings; they have no "now"
  const columns = timeline.columns.filter((c) => !c.removed);
  return (
    <section
      aria-label="Right now"
      // as many 240px cards per row as fit, so three staff on a tablet still share one row
      className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3"
    >
      {columns.map((column) => {
        const status = staffStatus(timeline, column, now);
        const { line, aside } = describe(status, now);
        return (
          <div
            key={column.staff.id}
            className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  status.kind === "busy"
                    ? "bg-primary"
                    : status.kind === "free"
                      ? "bg-card ring-2 ring-primary ring-inset"
                      : "bg-input",
                )}
              />
              <span className="min-w-0 truncate text-sm font-semibold">
                {column.staff.name}
              </span>
              {aside && (
                <span className="ml-auto shrink-0 text-[13px] font-medium whitespace-nowrap">
                  {aside}
                </span>
              )}
            </div>
            {/* breaks only between the parts, so "Cut + wash" never splits */}
            <p className="pl-[18px] text-[13px] text-muted-foreground">
              {line.map((part, i) => (
                <span key={i} className="whitespace-nowrap">
                  {i > 0 && " · "}
                  {part}
                </span>
              ))}
            </p>
          </div>
        );
      })}
    </section>
  );
}

/** The card's second line, in parts that never break inside, and the note beside the name */
function describe(status: StaffStatus, now: number) {
  switch (status.kind) {
    case "busy":
      return {
        line: [
          `With ${status.booking.customerName}`,
          status.booking.service.name,
        ],
        aside: `until ${clockLabel(status.until)}`,
      };
    case "free":
      return {
        line: status.next
          ? [
              "Free",
              `next: ${status.next.booking.customerName} at ${clockLabel(status.next.start)}`,
            ]
          : ["Free", "nothing else booked today"],
        aside: status.next
          ? `${formatDuration(status.until - now)} free`
          : `until ${clockLabel(status.until)}`,
      };
    case "starts":
      return { line: [`Starts at ${clockLabel(status.at)}`], aside: null };
    case "break":
      return {
        line: [`On a break until ${clockLabel(status.until)}`],
        aside: null,
      };
    case "done":
      return { line: ["Done for today"], aside: null };
    case "off":
      return { line: ["Off today"], aside: null };
  }
}
