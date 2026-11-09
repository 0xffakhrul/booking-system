import { formatTimeRange24 } from "@/lib/time";
import { cn } from "@/lib/utils";
import { clockLabel, type Span, type Timeline } from "./timeline";
import type { Booking } from "./useBookings";

const HOUR_PX = 64; // same scale as the mockup: a 45-minute haircut is 48px tall
const px = (minutes: number) => (minutes / 60) * HOUR_PX;

type Props = {
  timeline: Timeline;
  timezone: string;
  /** minutes into the day right now, when the timeline shows today */
  now?: number;
  /** tapping a booking opens it */
  onSelect: (booking: Booking) => void;
  /** tapping an empty spot: who, and minutes into the day, snapped to 15 */
  onPickSlot: (staffId: string, minutes: number) => void;
};

/** One column per staff member, bookings placed by start time and sized by length */
export function DayTimeline({
  timeline,
  timezone,
  now,
  onSelect,
  onPickSlot,
}: Props) {
  const height = px(timeline.end - timeline.start);
  const top = (span: Span) => px(span.start - timeline.start);
  const grid = {
    gridTemplateColumns: `3.5rem repeat(${timeline.columns.length}, minmax(10rem, 1fr))`,
  };
  const showNow =
    now !== undefined && now >= timeline.start && now <= timeline.end;

  return (
    // wide shops scroll sideways instead of squeezing columns
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex min-w-fit flex-col gap-2 pb-2">
        <div className="grid gap-2.5" style={grid}>
          <div className="sticky left-0 z-20 bg-card" />
          {timeline.columns.map((c) => (
            <div
              key={c.staff.id}
              className="truncate pb-1 text-sm font-semibold"
            >
              {c.staff.name}
              <span className="font-normal text-muted-foreground">
                {c.removed ? " (removed)" : startNote(c.off, timeline)}
              </span>
            </div>
          ))}
        </div>

        <div className="relative grid gap-2.5" style={grid}>
          {/* the hours stay put while the columns scroll sideways on a phone */}
          <div className="sticky left-0 z-20 bg-card" style={{ height }}>
            {timeline.hours.map((m) => (
              // an hour label right beside the now time would collide with it
              <div
                hidden={showNow && Math.abs(now - m) < 15}
                key={m}
                className="absolute right-0 text-xs whitespace-nowrap text-muted-foreground"
                style={{ top: Math.max(0, px(m - timeline.start) - 8) }}
              >
                {clockLabel(m)}
              </div>
            ))}
          </div>

          {timeline.columns.map((c) => (
            <div
              key={c.staff.id}
              role="group"
              aria-label={`${c.staff.name}'s bookings`}
              className={cn(
                "relative overflow-hidden rounded-lg",
                // removed staff can't take new bookings
                !c.removed && "cursor-copy",
              )}
              // A shortcut for mouse and touch. Keyboard users have the "New booking" button.
              onClick={(e) => {
                if (c.removed) return;
                const y =
                  e.clientY - e.currentTarget.getBoundingClientRect().top;
                const minutes =
                  timeline.start + Math.floor((y / HOUR_PX) * 4) * 15;
                onPickSlot(c.staff.id, Math.min(minutes, timeline.end - 15));
              }}
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
                  // a light hatch: not working, so not bookable online
                  className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,#f7f7f7_6px_12px)]"
                  style={{ top: top(span), height: px(span.end - span.start) }}
                />
              ))}

              {c.bookings.map(({ booking: b, ...span }) => {
                const h = px(span.end - span.start);
                const time = formatTimeRange24(b.start, b.end, timezone);
                const past = now !== undefined && span.end <= now;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // not also a tap on the empty column behind it
                      onSelect(b);
                    }}
                    title={`${b.customerName} · ${b.service.name} · ${time} · ${b.ref}`}
                    className={cn(
                      "absolute inset-x-1 z-10 flex flex-col justify-center overflow-hidden rounded-md px-2.5 text-left leading-tight transition-shadow outline-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:ring-3 focus-visible:ring-ring/40",
                      // online bookings in the brand tint, walk-ins and calls in grey
                      // already over today: quiet, so what's coming stands out
                      past
                        ? "bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                        : b.source === "online"
                          ? "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_var(--accent-border)]"
                          : "bg-muted text-foreground shadow-[inset_0_0_0_1px_var(--input)]",
                    )}
                    style={{ top: top(span) + 1, height: Math.max(h - 2, 14) }}
                  >
                    {/* spans, not divs: a button may only hold inline content */}
                    <span
                      className={cn(
                        "block truncate font-semibold",
                        // a 15-minute booking is only 16px tall
                        h < 24 ? "text-xs leading-none" : "text-[13px]",
                      )}
                    >
                      {b.customerName}
                      {/* too short for two lines: put the service beside the name */}
                      {h < 40 && (
                        <span className="font-normal"> · {b.service.name}</span>
                      )}
                    </span>
                    {h >= 40 && (
                      <span className="block truncate text-xs">
                        {b.service.name} · {time}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {showNow && (
            <>
              {/* the line runs under the bookings, so one in progress doesn't look struck through */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 left-14 z-[5] border-t-2 border-destructive"
                style={{ top: px(now - timeline.start) }}
              >
                <div className="absolute -top-[5px] left-0 size-2 rounded-full bg-destructive" />
              </div>
              {/* the time, over the sticky hour labels in the gutter */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-[calc(100%-3.5rem+6px)] z-30 -translate-y-1/2 rounded-sm bg-card px-1 text-xs font-semibold whitespace-nowrap text-destructive"
                style={{ top: px(now - timeline.start) + 1 }}
              >
                {clockLabel(now)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** " · from 13:00" for someone who starts after the grid does, " · off" for a day off */
function startNote(off: Span[], timeline: Timeline) {
  const first = off[0];
  if (!first || first.start > timeline.start) return "";
  if (first.end >= timeline.end) return " · off";
  return ` · from ${clockLabel(first.end)}`;
}
