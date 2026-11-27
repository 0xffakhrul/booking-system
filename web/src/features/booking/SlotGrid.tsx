import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { describeDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { focusRing, Note } from "./BookingLayout";
import type { Slot } from "./useAvailability";

type Props = {
  slots: Slot[] | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  date: string;
  nextDate: string | null; // the day after, if it's still in the booking window
  onSelectDate: (date: string) => void;
  timeZone: string;
  selected: string | null; // the chosen slot's start
  onSelect: (start: string) => void;
  onContinue: () => void;
};

/**
 * The free times for one day. A 3-column grid on a phone (Continue is in the bottom bar);
 * from md up a list, where the picked time splits to show Continue beside it.
 */
export function SlotGrid({
  slots,
  isPending,
  error,
  onRetry,
  date,
  nextDate,
  onSelectDate,
  timeZone,
  selected,
  onSelect,
  onContinue,
}: Props) {
  const day = describeDate(date).short;
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // From md up the list scrolls inside its pane; keep the picked time (from a link or a
  // refresh) in view there. Rows snap, so the list never rests on a half-cut button. On a phone the list doesn't scroll, so this does nothing.
  useEffect(() => {
    const list = listRef.current;
    const item = selectedRef.current;
    if (!list || !item || list.scrollHeight <= list.clientHeight) return;
    const above = item.offsetTop < list.scrollTop;
    const below =
      item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight;
    if (above || below)
      list.scrollTop =
        item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
  }, [selected, slots]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="times-heading" className="text-sm font-semibold md:text-[15px]">
          <span className="md:hidden">Time</span>
          <span className="hidden md:inline">{day}</span>
        </h2>
        {slots && slots.length > 0 && (
          <span className="text-[13px] text-muted-foreground">
            {slots.length} free
          </span>
        )}
      </div>

      {isPending ? (
        <div className="grid grid-cols-3 gap-2 md:flex md:flex-col" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <Note>
          <p>
            Couldn't load the free times. Check your connection and try again.
          </p>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </Note>
      ) : !slots?.length ? (
        <Note>
          <p>No free times left on {day}.</p>
          {nextDate && (
            <Button variant="outline" onClick={() => onSelectDate(nextDate)}>
              Try {describeDate(nextDate).short}
            </Button>
          )}
        </Note>
      ) : (
        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby="times-heading"
          // relative: the auto-scroll above measures items against this box
          className="relative grid grid-cols-3 gap-2 md:-mx-1 md:flex md:max-h-[440px] md:flex-col md:snap-y md:snap-mandatory md:scroll-pt-4 md:overflow-y-auto md:px-1 md:[scrollbar-color:var(--input)_transparent] md:[scrollbar-width:thin] md:[mask-image:linear-gradient(to_bottom,transparent,black_16px,black_calc(100%-28px),transparent)] md:pt-4 md:pb-6"
        >
          {slots.map((slot) => {
            const isSelected = slot.start === selected;
            const time = formatTime(slot.start, timeZone);
            return (
              <div
                key={slot.start}
                ref={isSelected ? selectedRef : undefined}
                className={cn(
                  "md:shrink-0 md:snap-start",
                  isSelected && "md:grid md:grid-cols-2 md:gap-2",
                )}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(slot.start)}
                  className={cn(
                    "h-11 w-full rounded-lg text-sm whitespace-nowrap transition-[background-color,box-shadow,color] duration-150",
                    focusRing,
                    isSelected
                      ? "bg-primary font-semibold text-primary-foreground md:bg-accent md:text-accent-foreground md:shadow-[inset_0_0_0_1px_var(--accent-border)]"
                      : "bg-card font-medium shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--primary)] md:font-semibold md:shadow-[inset_0_0_0_1px_var(--input)]",
                  )}
                >
                  {time}
                </button>
                {isSelected && (
                  <Button
                    aria-label={`Continue with ${time}`}
                    onClick={onContinue}
                    className="hidden h-11 rounded-lg border-0 text-sm font-semibold animate-in duration-200 ease-out slide-in-from-left-2 motion-reduce:animate-none md:inline-flex"
                  >
                    Continue
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
