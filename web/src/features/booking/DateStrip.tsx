import { useEffect, useRef } from "react";
import { describeDate } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = {
  dates: string[]; // "YYYY-MM-DD", in the business's calendar
  selected: string;
  onSelect: (date: string) => void;
};

/** One row of days that scrolls sideways, six visible at a time like the mockup's week */
export function DateStrip({ dates, selected, onSelect }: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // a link straight to a later date (?date=…) opens with that day in view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [selected]);

  return (
    <section className="flex flex-col gap-2">
      <h2 id="date-heading" className="text-[15px] font-semibold">
        {describeDate(selected).month}
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="date-heading"
        className="-mx-5 flex snap-x scroll-px-5 gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
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
                // (100% - 5 gaps of 6px) / 6: six days fill the row, the seventh peeks in
                "flex h-14 w-[calc((100%-30px)/6)] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:border-primary/40",
              )}
            >
              <span className="text-[11px] font-semibold">{weekday}</span>
              <span className="text-[17px] leading-none font-bold">{day}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
