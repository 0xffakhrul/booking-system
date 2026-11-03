import { describeDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Slot } from "./useAvailability";

type Props = {
  slots: Slot[] | undefined;
  isPending: boolean;
  error: Error | null;
  date: string;
  timeZone: string;
  selected: string | null; // the chosen slot's start
  onSelect: (start: string) => void;
};

export function SlotGrid({
  slots,
  isPending,
  error,
  date,
  timeZone,
  selected,
  onSelect,
}: Props) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 id="times-heading" className="text-[15px] font-semibold">
          Available times
        </h2>
        <span className="text-xs text-muted-foreground">
          with anyone available
        </span>
      </div>

      {isPending ? (
        <div className="grid grid-cols-3 gap-2" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-[46px] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Couldn't load times: {error.message}
        </p>
      ) : !slots?.length ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          No times left on {describeDate(date).short}. Try another day.
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby="times-heading"
          className="grid grid-cols-3 gap-2"
        >
          {slots.map((slot) => {
            const isSelected = slot.start === selected;
            return (
              <button
                key={slot.start}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(slot.start)}
                className={cn(
                  "h-[46px] rounded-lg border text-sm font-semibold whitespace-nowrap transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:border-primary/40",
                )}
              >
                {formatTime(slot.start, timeZone)}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
