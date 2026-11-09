import { useEffect, useRef } from "react";
import { describeDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import { focusRing } from "./BookingLayout";

type Props = {
  dates: string[]; // "YYYY-MM-DD", in the business's calendar
  selected: string;
  onSelect: (date: string) => void;
  className?: string;
};

/** One row of days that scrolls sideways (phone and tablet; desktop gets the month calendar) */
export function DateStrip({ dates, selected, onSelect, className }: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // a link straight to a later date (?date=…) opens with that day in view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [selected]);

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="date-heading" className="text-sm font-semibold">
          Date
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {describeDate(selected).month}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="date-heading"
        // bleeds to the screen edge so the next day peeks in, hinting that it scrolls
        className="-mx-[18px] flex snap-x scroll-px-[18px] gap-1.5 overflow-x-auto px-[18px] pt-0.5 pb-1 [scrollbar-width:none] md:-mx-6 md:scroll-px-6 md:px-6"
      >
        {dates.map((date) => {
          const { weekday, day, long } = describeDate(date);
          const isSelected = date === selected;
          return (
            <button
              key={date}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={long}
              onClick={() => onSelect(date)}
              className={cn(
                "flex h-[62px] w-[52px] shrink-0 snap-start flex-col items-center justify-center gap-px rounded-lg transition-[background-color,box-shadow] duration-150",
                focusRing,
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-card shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--input)]",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected
                    ? "text-primary-foreground/85"
                    : "text-muted-foreground",
                )}
              >
                {weekday}
              </span>
              <span className="text-lg leading-none font-semibold">{day}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
