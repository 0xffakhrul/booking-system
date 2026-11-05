import { formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Span, Timeline } from "./timeline";

const HOUR_PX = 64; // same scale as the mockup: a 45-minute haircut is 48px tall
const px = (minutes: number) => (minutes / 60) * HOUR_PX;

/** "9 AM", "12 PM", "6 PM" */
function hourLabel(minutes: number) {
  const h = minutes / 60;
  return `${((h + 11) % 12) + 1} ${h < 12 || h === 24 ? "AM" : "PM"}`;
}

type Props = {
  timeline: Timeline;
  timezone: string;
  /** minutes into the day right now, when the timeline shows today */
  now?: number;
};

/** One column per staff member, bookings placed by start time and sized by length */
export function DayTimeline({ timeline, timezone, now }: Props) {
  const height = px(timeline.end - timeline.start);
  const top = (span: Span) => px(span.start - timeline.start);
  const grid = {
    gridTemplateColumns: `3.5rem repeat(${timeline.columns.length}, minmax(9rem, 1fr))`,
  };
  const showNow =
    now !== undefined && now >= timeline.start && now <= timeline.end;

  return (
    // wide shops scroll sideways instead of squeezing columns
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex min-w-fit flex-col gap-2 pb-2">
        <div className="grid gap-2.5" style={grid}>
          <div />
          {timeline.columns.map((c) => (
            <div key={c.staff.id} className="truncate text-sm font-bold">
              {c.staff.name}
              {c.removed && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (removed)
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="relative grid gap-2.5" style={grid}>
          <div className="relative" style={{ height }}>
            {timeline.hours.map((m) => (
              <div
                key={m}
                className="absolute right-0 text-xs whitespace-nowrap text-muted-foreground"
                style={{ top: Math.max(0, px(m - timeline.start) - 8) }}
              >
                {hourLabel(m)}
              </div>
            ))}
          </div>

          {timeline.columns.map((c) => (
            <div
              key={c.staff.id}
              role="list"
              aria-label={`${c.staff.name}'s bookings`}
              className="relative overflow-hidden rounded-lg"
              style={{
                height,
                // a hairline every hour, like the mockup
                backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX}px)`,
              }}
            >
              {c.off.map((span) => (
                <div
                  key={span.start}
                  aria-hidden
                  className="absolute inset-x-0 bg-muted/80"
                  style={{ top: top(span), height: px(span.end - span.start) }}
                />
              ))}

              {c.bookings.map(({ booking: b, ...span }) => {
                const h = px(span.end - span.start);
                const time = formatTimeRange(b.start, b.end, timezone);
                return (
                  <div
                    key={b.id}
                    role="listitem"
                    title={`${b.customerName} · ${b.service.name} · ${time} · ${b.ref}`}
                    className={cn(
                      "absolute inset-x-1 flex flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-2 leading-tight",
                      b.source === "online"
                        ? "border-primary bg-accent text-foreground"
                        : "border-muted-foreground/60 bg-secondary text-foreground",
                    )}
                    style={{ top: top(span) + 1, height: Math.max(h - 2, 14) }}
                  >
                    <div
                      className={cn(
                        "truncate font-bold",
                        // a 15-minute booking is only 16px tall
                        h < 24 ? "text-xs leading-none" : "text-[13px]",
                      )}
                    >
                      {b.customerName}
                      {/* too short for two lines: put the service beside the name */}
                      {h < 40 && (
                        <span className="font-normal opacity-80">
                          {" "}
                          · {b.service.name}
                        </span>
                      )}
                    </div>
                    {h >= 40 && (
                      <div className="truncate text-xs opacity-80">
                        {b.service.name} · {time}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {showNow && (
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 left-14 z-10 border-t-2 border-red-500"
              style={{ top: px(now - timeline.start) }}
            >
              <div className="absolute -top-[5px] -left-1 size-2 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
