import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { describeDate, weekdayOf } from "@/lib/time";
import { cn } from "@/lib/utils";
import { focusRing } from "./BookingLayout";

type Props = {
  dates: string[]; // the bookable window, "YYYY-MM-DD", today first
  selected: string;
  onSelect: (date: string) => void;
  className?: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * The desktop date picker: one month at a time, Monday first. Days inside the booking
 * window are tinted and clickable; the rest of the month is shown but disabled.
 */
export function MonthCalendar({ dates, selected, onSelect, className }: Props) {
  const months = [...new Set(dates.map((d) => d.slice(0, 7)))]; // "2026-11", "2026-12"
  const [shown, setShown] = useState(selected.slice(0, 7));
  // picking a date elsewhere (the strip, a link) brings its month into view
  const [lastSelected, setLastSelected] = useState(selected);
  if (selected !== lastSelected) {
    setLastSelected(selected);
    setShown(selected.slice(0, 7));
  }

  const index = Math.max(0, months.indexOf(shown));
  const month = months[index]!;
  const [year, monthNumber] = month.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leadingBlanks = (weekdayOf(`${month}-01`) + 6) % 7; // Monday = 0
  const bookable = new Set(dates);
  const today = dates[0];
  const [monthName, yearText] = describeDate(`${month}-01`).month.split(" ");

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <h2 id="calendar-heading" className="text-base font-semibold">
          {monthName}{" "}
          <span className="font-medium text-muted-foreground">{yearText}</span>
        </h2>
        <div className="flex gap-1">
          <MonthButton
            label="Previous month"
            disabled={index === 0}
            onClick={() => setShown(months[index - 1]!)}
          >
            <ChevronLeftIcon />
          </MonthButton>
          <MonthButton
            label="Next month"
            disabled={index === months.length - 1}
            onClick={() => setShown(months[index + 1]!)}
          >
            <ChevronRightIcon />
          </MonthButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            aria-hidden
            className="pb-1 text-center text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase"
          >
            {day}
          </span>
        ))}
      </div>
      <div
        role="radiogroup"
        aria-labelledby="calendar-heading"
        className="grid grid-cols-7 gap-1.5"
      >
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const isBookable = bookable.has(date);
          const isSelected = date === selected;
          return (
            <button
              key={date}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={describeDate(date).long}
              aria-current={date === today ? "date" : undefined}
              disabled={!isBookable}
              onClick={() => onSelect(date)}
              className={cn(
                "relative aspect-square rounded-lg text-[15px] transition-[background-color,box-shadow] duration-150",
                focusRing,
                // today gets a small dot under its number
                date === today &&
                  "after:absolute after:bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isBookable
                    ? "bg-accent font-semibold text-accent-foreground hover:shadow-[inset_0_0_0_1px_var(--accent-border)]"
                    : "font-medium text-[#8a8a8a]",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MonthButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-[5px] shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-muted disabled:pointer-events-none disabled:text-[#b5b5b5] [&_svg]:size-4",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}
